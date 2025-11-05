/**
 * Multi-level diversity ranking for k-means recommendations
 *
 * Implements quality-weighted selection with:
 * - Inter-cluster diversity: Exponential decay prevents cluster monopolization
 * - Intra-cluster diversity: Penalizes items too similar to last selected from cluster
 * - Quality signals: Incorporates tunable bias_term and scraped review counts
 * - Deterministic: Seeded PRNG using user_id + rated beer IDs
 */

import type { RankingParams } from './config';
import { RANKING_PARAMS, validateRankingParams } from './config';

/**
 * Extended candidate beer with ranking metadata
 */
export interface RankedCandidateBeer {
  beer_id: number;
  embedding: number[];
  similarity: number; // Cosine distance to centroid (0 = identical, 2 = opposite)
  cluster_index: number; // Which cluster this belongs to
  bias_term: number;
  scraped_review_count: number;
  name: string;
  style: string;
  abv: number | null;
  brewery_id: number | null;
  brewery_name?: string;
  brewery_city?: string;
  brewery_country?: string;
  description?: string;
  score?: number; // Calculated quality score (assigned during ranking)
}

/**
 * Seeded pseudo-random number generator
 * Creates deterministic random numbers based on a string seed
 */
class SeededRandom {
  private state: number;

  constructor(seed: string) {
    // Hash string to number
    this.state = this.hashString(seed);
  }

  /**
   * Hash a string to a positive integer seed
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash) || 1;
  }

  /**
   * Generate next random number between 0 and 1
   * Uses mulberry32 algorithm for good distribution
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 (opposite) and 1 (identical)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must have the same length (got ${a.length} and ${b.length})`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate quality score for a candidate beer
 *
 * Score = similarity_score × quality_boost
 * where:
 *   similarity_score = 1 - (cosine_distance / 2)  [converts distance to 0-1 score]
 *   quality_boost = (bias_term ^ alpha) × log(1 + scraped_review_count)
 *
 * @param candidate - Beer candidate with similarity, bias_term, and review_count
 * @param alpha - Bias term exponent (dampens influence)
 * @returns Quality score (higher is better)
 */
function calculateScore(
  candidate: RankedCandidateBeer,
  alpha: number
): number {
  // Convert cosine distance (0-2) to similarity score (0-1)
  // Distance 0 = identical (score 1), distance 2 = opposite (score 0)
  const similarityScore = 1 - candidate.similarity / 2;

  // Quality boost from bias term (dampened by alpha)
  const biasFactor = Math.pow(Math.max(0, candidate.bias_term ?? 0), alpha);

  return similarityScore * (1 + biasFactor);
}

/**
 * Weighted random selection from array
 * Uses seeded random for determinism
 *
 * @param items - Array of items to select from
 * @param weights - Corresponding weights (must match items length)
 * @param random - Seeded random generator
 * @returns Selected item
 */
function weightedRandomSelect<T>(
  items: T[],
  weights: number[],
  random: SeededRandom
): T {
  if (items.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  if (items.length !== weights.length) {
    throw new Error('Items and weights must have same length');
  }

  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    // All weights zero or negative, select first item
    return items[0];
  }

  let rand = random.next() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      return items[i];
    }
  }

  // Fallback (should not reach here)
  return items[items.length - 1];
}

/**
 * Main diverse ranking algorithm
 *
 * Generates a complete ordered list of candidates with multi-level diversity:
 * 1. Calculate quality scores for all candidates
 * 2. Iteratively select items balancing cluster diversity and quality
 * 3. Penalize intra-cluster similarity to avoid near-duplicates
 *
 * @param candidatesByCluster - Candidates grouped by cluster index
 * @param seed - Deterministic seed for reproducibility (user_id + rated beer IDs)
 * @param params - Optional ranking parameters (uses defaults if not provided)
 * @returns Ordered array of candidates
 */
export function diverseRanking(
  candidatesByCluster: Map<number, RankedCandidateBeer[]>,
  seed: string,
  params: RankingParams = RANKING_PARAMS
): RankedCandidateBeer[] {
  // Validate parameters
  validateRankingParams(params);

  const { alpha, lambda, beta, threshold, topK } = params;

  // Initialize seeded random generator
  const random = new SeededRandom(seed);

  // Calculate scores for all candidates
  for (const candidates of candidatesByCluster.values()) {
    for (const candidate of candidates) {
      candidate.score = calculateScore(candidate, alpha);
    }
  }

  // Sort candidates within each cluster by score (descending)
  for (const candidates of candidatesByCluster.values()) {
    candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  // Track state during selection
  const selected: RankedCandidateBeer[] = [];
  const clusterPointers = new Map<number, number>(); // Next index to select from each cluster
  const clusterSelectionCounts = new Map<number, number>(); // How many selected from each cluster
  const lastSelectedFromCluster = new Map<number, RankedCandidateBeer>(); // For intra-cluster diversity

  // Initialize cluster state
  for (const clusterIndex of candidatesByCluster.keys()) {
    clusterPointers.set(clusterIndex, 0);
    clusterSelectionCounts.set(clusterIndex, 0);
  }

  // Calculate total number of candidates
  const totalCandidates = Array.from(candidatesByCluster.values()).reduce(
    (sum, candidates) => sum + candidates.length,
    0
  );

  // Selection loop: build complete ordered list
  while (selected.length < totalCandidates) {
    // Step 1: Calculate cluster selection weights
    const clusterWeights = new Map<number, number>();
    const activeClusters: number[] = [];

    for (const [clusterIndex, candidates] of candidatesByCluster.entries()) {
      const pointer = clusterPointers.get(clusterIndex) ?? 0;

      // Skip if no more candidates in this cluster
      if (pointer >= candidates.length) {
        continue;
      }

      activeClusters.push(clusterIndex);

      // Base weight: average score of top K items (or remaining if fewer)
      const topKCandidates = candidates.slice(pointer, pointer + topK);
      const avgScore =
        topKCandidates.reduce((sum, c) => sum + (c.score ?? 0), 0) /
        topKCandidates.length;

      // Apply exponential decay based on how many already selected from this cluster
      const selectionCount = clusterSelectionCounts.get(clusterIndex) ?? 0;
      const decayFactor = Math.exp(-lambda * selectionCount);

      clusterWeights.set(clusterIndex, avgScore * decayFactor);
    }

    // Check if done (no active clusters)
    if (activeClusters.length === 0) {
      break;
    }

    // Step 2: Select cluster using weighted random selection
    const selectedClusterIndex = weightedRandomSelect(
      activeClusters,
      activeClusters.map((idx) => clusterWeights.get(idx) ?? 0),
      random
    );

    const clusterCandidates = candidatesByCluster.get(selectedClusterIndex)!;
    const pointer = clusterPointers.get(selectedClusterIndex) ?? 0;

    // Step 3: Select item from cluster with intra-cluster diversity
    let selectedCandidate: RankedCandidateBeer;

    const lastSelected = lastSelectedFromCluster.get(selectedClusterIndex);

    if (lastSelected) {
      // Apply diversity penalty: reduce score if too similar to last selected
      let bestCandidate = clusterCandidates[pointer];
      let bestAdjustedScore = bestCandidate.score ?? 0;

      // Check next few candidates for diversity
      // Only check up to 5 items ahead for performance
      const lookAhead = Math.min(5, clusterCandidates.length - pointer);

      for (let i = 0; i < lookAhead; i++) {
        const candidate = clusterCandidates[pointer + i];
        const similarity = cosineSimilarity(
          candidate.embedding,
          lastSelected.embedding
        );

        let adjustedScore = candidate.score ?? 0;

        // Apply penalty if similarity exceeds threshold
        if (similarity > threshold) {
          const diversityPenalty = similarity - threshold;
          adjustedScore *= 1 - beta * diversityPenalty;
        }

        if (adjustedScore > bestAdjustedScore) {
          bestAdjustedScore = adjustedScore;
          bestCandidate = candidate;
        }
      }

      selectedCandidate = bestCandidate;

      // Update pointer to skip selected candidate
      const selectedIndex = clusterCandidates.indexOf(selectedCandidate);
      clusterPointers.set(selectedClusterIndex, selectedIndex + 1);
    } else {
      // First selection from this cluster: just take top item
      selectedCandidate = clusterCandidates[pointer];
      clusterPointers.set(selectedClusterIndex, pointer + 1);
    }

    // Step 4: Update state
    selected.push(selectedCandidate);
    clusterSelectionCounts.set(
      selectedClusterIndex,
      (clusterSelectionCounts.get(selectedClusterIndex) ?? 0) + 1
    );
    lastSelectedFromCluster.set(selectedClusterIndex, selectedCandidate);
  }

  return selected;
}

/**
 * Create deterministic seed from user ID and rated beer IDs
 * Ensures same user with same ratings gets same recommendations
 *
 * @param userId - User ID (or anonymous identifier)
 * @param ratedBeerIds - Array of beer IDs user has rated (sorted)
 * @returns Seed string for PRNG
 */
export function createRecommendationSeed(
  userId: string | null,
  ratedBeerIds: number[]
): string {
  const userPart = userId ?? 'anonymous';
  const beersPart = ratedBeerIds.sort((a, b) => a - b).join(',');
  return `${userPart}:${beersPart}`;
}
