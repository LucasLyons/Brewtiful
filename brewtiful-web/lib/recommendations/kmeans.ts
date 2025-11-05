import type {
  CandidateBeer,
} from '@/lib/recommendations/user-kmeans';
import {
  diverseRanking,
  createRecommendationSeed,
  type RankedCandidateBeer,
} from '@/lib/recommendations/diverse-ranking';
import type { RankingParams } from '@/lib/recommendations/config';

/**
 * K-means clustering utilities for beer recommendations
 * Uses weighted k-means with rating weights to find beer taste clusters
 */

export interface BeerEmbedding {
  beer_id: number;
  embedding: number[];
  rating?: number;
}

/**
 * Seeded pseudo-random number generator using mulberry32
 * Creates deterministic random numbers based on a seed
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between 0 (inclusive) and max (exclusive)
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

export interface ClusterResult {
  centroids: number[][];
  assignments: number[];
}

/**
 * Generate a deterministic seed from beer IDs
 * Uses a simple hash function to combine beer IDs into a single seed
 */
function generateSeedFromBeerIds(beerIds: number[]): number {
  let seed = 0;
  for (let i = 0; i < beerIds.length; i++) {
    // Simple hash combining: mix beer_id with position
    seed = ((seed << 5) - seed + beerIds[i]) | 0;
  }
  // Ensure positive number
  return Math.abs(seed) || 1;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    console.error(`Vector length mismatch: a.length=${a.length}, b.length=${b.length}`);
    console.error('Vector a sample:', a.slice(0, 5));
    console.error('Vector b sample:', b.slice(0, 5));
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
 * Find the nearest centroid for a given embedding
 */
function findNearestCentroid(
  embedding: number[],
  centroids: number[][]
): number {
  let maxSimilarity = -Infinity;
  let nearestIdx = 0;

  for (let i = 0; i < centroids.length; i++) {
    const similarity = cosineSimilarity(embedding, centroids[i]);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      nearestIdx = i;
    }
  }

  return nearestIdx;
}

/**
 * Initialize centroids using k-means++ algorithm
 * @param beers - Array of beer embeddings
 * @param k - Number of centroids
 * @param rng - Seeded random number generator for deterministic results
 */
function initializeCentroids(
  beers: BeerEmbedding[],
  k: number,
  rng: SeededRandom
): number[][] {
  const centroids: number[][] = [];

  // Choose first centroid randomly (with seed)
  const firstIdx = rng.nextInt(beers.length);
  centroids.push([...beers[firstIdx].embedding]);

  // Choose remaining centroids using k-means++
  for (let i = 1; i < k; i++) {
    const distances = beers.map((beer) => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const similarity = cosineSimilarity(beer.embedding, centroid);
        const dist = 1 - similarity; // Convert similarity to distance
        minDist = Math.min(minDist, dist);
      }
      return minDist;
    });

    // Choose next centroid with probability proportional to distance squared
    const distancesSquared = distances.map((d) => d * d);
    const totalDist = distancesSquared.reduce((sum, d) => sum + d, 0);
    let random = rng.next() * totalDist;

    for (let j = 0; j < beers.length; j++) {
      random -= distancesSquared[j];
      if (random <= 0) {
        centroids.push([...beers[j].embedding]);
        break;
      }
    }
  }

  return centroids;
}

/**
 * Perform weighted k-means clustering on beer embeddings
 * @param beers - Array of beer embeddings with ratings
 * @param k - Number of clusters (default 3)
 * @param maxIterations - Maximum iterations (default 100)
 * @param tolerance - Convergence tolerance (default 1e-4)
 * @param seed - Optional seed for deterministic clustering (generated from beer IDs if not provided)
 */
export function weightedKMeans(
  beers: BeerEmbedding[],
  k: number = 3,
  maxIterations: number = 100,
  tolerance: number = 1e-4,
  seed?: number
): ClusterResult {
  if (beers.length === 0) {
    throw new Error('No beers provided for clustering');
  }

  if (k > beers.length) {
    k = beers.length;
  }

  const embeddingDim = beers[0].embedding.length;

  // Generate seed from beer IDs if not provided
  const actualSeed = seed ?? generateSeedFromBeerIds(beers.map((b) => b.beer_id));
  const rng = new SeededRandom(actualSeed);

  // Initialize centroids using k-means++
  let centroids = initializeCentroids(beers, k, rng);
  let assignments = new Array(beers.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each beer to nearest centroid
    const newAssignments = beers.map((beer) =>
      findNearestCentroid(beer.embedding, centroids)
    );

    // Check for convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    if (!changed) {
      break;
    }

    assignments = newAssignments;

    // Update centroids with weighted average
    const newCentroids: number[][] = [];
    for (let clusterId = 0; clusterId < k; clusterId++) {
      const clusterBeers = beers.filter(
        (_, idx) => assignments[idx] === clusterId
      );

      if (clusterBeers.length === 0) {
        // Keep old centroid if cluster is empty
        newCentroids.push(centroids[clusterId]);
        continue;
      }

      // Calculate weighted centroid (higher ratings have more influence)
      const centroid = new Array(embeddingDim).fill(0);
      let totalWeight = 0;

      for (const beer of clusterBeers) {
        const weight = beer.rating ?? 1; // Use rating as weight, default to 1
        totalWeight += weight;

        for (let i = 0; i < embeddingDim; i++) {
          centroid[i] += beer.embedding[i] * weight;
        }
      }

      // Normalize by total weight
      for (let i = 0; i < embeddingDim; i++) {
        centroid[i] /= totalWeight;
      }

      newCentroids.push(centroid);
    }

    // Check centroid convergence
    let maxCentroidShift = 0;
    for (let i = 0; i < k; i++) {
      const shift = 1 - cosineSimilarity(centroids[i], newCentroids[i]);
      maxCentroidShift = Math.max(maxCentroidShift, shift);
    }

    centroids = newCentroids;

    if (maxCentroidShift < tolerance) {
      break;
    }
  }

  return { centroids, assignments };
}

/**
 * Select diverse seed beers using k-means++ style selection
 * This ensures seeds are spread across the user's taste diversity
 * @param beers - Array of beer embeddings to select from
 * @param k - Number of seeds to select (default 5)
 * @param seed - Optional seed for deterministic selection (generated from beer IDs if not provided)
 * @returns Array of k diverse beer embeddings
 */
export function selectDiverseSeeds(
  beers: BeerEmbedding[],
  k: number = 5,
  seed?: number
): BeerEmbedding[] {
  if (beers.length === 0) {
    throw new Error('No beers provided for seed selection');
  }

  if (k > beers.length) {
    // If k is greater than available beers, return all beers
    return [...beers];
  }

  // Generate seed from beer IDs if not provided
  const actualSeed = seed ?? generateSeedFromBeerIds(beers.map((b) => b.beer_id));
  const rng = new SeededRandom(actualSeed);

  const seeds: BeerEmbedding[] = [];

  // Choose first seed randomly (but deterministically)
  const firstIdx = rng.nextInt(beers.length);
  seeds.push(beers[firstIdx]);

  // Choose remaining seeds using k-means++ approach
  for (let i = 1; i < k; i++) {
    const distances = beers.map((beer) => {
      let minDist = Infinity;
      for (const seed of seeds) {
        const similarity = cosineSimilarity(beer.embedding, seed.embedding);
        const dist = 1 - similarity; // Convert similarity to distance
        minDist = Math.min(minDist, dist);
      }
      return minDist;
    });

    // Choose next seed with probability proportional to distance squared
    const distancesSquared = distances.map((d) => d * d);
    const totalDist = distancesSquared.reduce((sum, d) => sum + d, 0);
    let random = rng.next() * totalDist;

    for (let j = 0; j < beers.length; j++) {
      random -= distancesSquared[j];
      if (random <= 0) {
        seeds.push(beers[j]);
        break;
      }
    }
  }

  return seeds;
}

/**
 * Find the k most similar embeddings to a target embedding
 */
export function findMostSimilar(
  target: number[],
  candidates: BeerEmbedding[],
  k: number
): BeerEmbedding[] {
  const similarities = candidates.map((beer) => ({
    beer,
    similarity: cosineSimilarity(target, beer.embedding),
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Return top k
  return similarities.slice(0, k).map((s) => s.beer);
}

/**
 * Generate diverse recommendations from clustered candidates
 * Uses multi-level diversity (inter-cluster and intra-cluster) with quality weighting
 *
 * @param candidates - Candidate beers with cluster_index, similarity, bias_term, and review counts
 * @param userId - User ID for deterministic seeding
 * @param ratedBeerIds - IDs of beers user has rated (for seed reproducibility)
 * @param targetCount - Target number of recommendations per page (default 12)
 * @param offset - Number of recommendations to skip (for pagination, default 0)
 * @param rankingParams - Optional ranking parameters (alpha, lambda, beta, etc.)
 * @returns Object with recommendations array and metadata
 */
export function recommendFromCentroids(
  candidates: CandidateBeer[],
  userId: string | null,
  ratedBeerIds: number[],
  targetCount: number = 12,
  offset: number = 0,
  rankingParams?: RankingParams
): { recommendations: CandidateBeer[]; hasMore: boolean; totalAvailable: number } {
  // Group candidates by cluster_index
  const candidatesByCluster = new Map<number, RankedCandidateBeer[]>();

  for (const candidate of candidates) {
    const clusterIndex = candidate.cluster_index;
    if (!candidatesByCluster.has(clusterIndex)) {
      candidatesByCluster.set(clusterIndex, []);
    }
    // Cast to RankedCandidateBeer (they have the same fields)
    candidatesByCluster.get(clusterIndex)!.push(candidate as RankedCandidateBeer);
  }

  // Create deterministic seed from user ID and rated beer IDs
  const seed = createRecommendationSeed(userId, ratedBeerIds);

  // Apply diverse ranking algorithm
  const allRecommendations = diverseRanking(
    candidatesByCluster,
    seed,
    rankingParams
  );

  // Apply pagination: skip offset items and take targetCount
  const paginatedRecommendations = allRecommendations.slice(offset, offset + targetCount);
  const hasMore = allRecommendations.length > offset + targetCount;

  return {
    recommendations: paginatedRecommendations,
    hasMore,
    totalAvailable: allRecommendations.length,
  };
}

/**
 * Evaluate cluster quality by checking if each cluster has enough items
 * within a similarity threshold
 * @param centroids - Cluster centroids
 * @param candidates - Candidate beers (optional - will be fetched if not provided)
 * @param minItemsPerCluster - Minimum items each cluster should have
 * @param similarityThreshold - Minimum cosine similarity (0-1, default 0.7)
 * @param userId - User ID for fetching candidates (required if candidates not provided)
 * @param beersPerCentroid - Number of beers per centroid to fetch (default 200)
 * @returns Object with isValid flag and cluster sizes
 */
export async function evaluateClusterQuality(
  centroids: number[][],
  candidates?: BeerEmbedding[],
  minItemsPerCluster: number = 5,
  similarityThreshold: number = 0.7,
  userId?: string | null,
  beersPerCentroid: number = 200
): Promise<{ isValid: boolean; clusterSizes: number[] }> {
  // Fetch candidates if not provided
  let candidateBeers = candidates;

  if (!candidateBeers) {
    if (userId === undefined) {
      throw new Error('userId must be provided when candidates are not provided');
    }

    const response = await fetch('/api/recommendations/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        centroids,
        userId,
        beersPerCentroid,
        showInactive: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch candidates');
    }

    const candidateResponse: CandidateBeer[] = await response.json();
    candidateBeers = candidateResponse.map((beer) => ({
      beer_id: beer.beer_id,
      embedding: beer.embedding,
    }));
  }

  const clusterSizes = new Array(centroids.length).fill(0);

  // For each beer, assign it to its nearest centroid IF similarity meets threshold
  for (const beer of candidateBeers) {
    let maxSimilarity = -Infinity;
    let nearestCluster = -1;

    // Find nearest centroid
    for (let i = 0; i < centroids.length; i++) {
      const similarity = cosineSimilarity(beer.embedding, centroids[i]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        nearestCluster = i;
      }
    }

    // Only count if similarity meets threshold
    if (maxSimilarity >= similarityThreshold && nearestCluster >= 0) {
      clusterSizes[nearestCluster]++;
    }
  }

  // Check if all clusters have enough items
  const isValid = clusterSizes.every((size) => size >= minItemsPerCluster);

  return { isValid, clusterSizes };
}

/**
 * Adaptively select the best k value with PRE-FETCHED candidates
 * Uses batch-fetched candidates to avoid sequential API calls
 * @param beers - Rated beers with embeddings
 * @param candidatesByK - Pre-fetched candidates for each k value (e.g. { k1: [...], k2: [...], k5: [...] })
 * @param kRange - Array of k values to try (default [1,2,3,4,5])
 * @param minItemsPerCluster - Minimum items per cluster (default 5)
 * @param similarityThreshold - Similarity threshold for cluster membership (default 0.7)
 * @param minTotalRecommendations - Minimum total recommendations to return (default 12)
 * @returns ClusterResult with the best k value
 */
export async function adaptiveKMeansWithPrefetch(
  beers: BeerEmbedding[],
  candidatesByK: Record<string, CandidateBeer[]>,
  kRange: number[] = [1, 2, 3, 4, 5],
  minItemsPerCluster: number = 5,
  similarityThreshold: number = 0.7,
  minTotalRecommendations: number = 12
): Promise<ClusterResult & { k: number; clusterSizes: number[] }> {
  console.log('Starting adaptive k-means selection with pre-fetched candidates...');

  let bestResult: (ClusterResult & { k: number; clusterSizes: number[] }) | null = null;

  for (const k of kRange) {
    // Can't have more clusters than beers
    if (k > beers.length) {
      console.log(`Skipping k=${k} (more than ${beers.length} rated beers)`);
      continue;
    }

    console.log(`Trying k=${k}...`);

    // Run k-means clustering
    const result = weightedKMeans(beers, k);

    // Get pre-fetched candidates for this k
    const candidateKey = `k${k}`;
    const candidateResponse = candidatesByK[candidateKey];

    if (!candidateResponse || candidateResponse.length === 0) {
      console.warn(`No candidates found for k=${k}, skipping`);
      continue;
    }

    const candidateEmbeddings: BeerEmbedding[] = candidateResponse.map(
      (beer) => ({
        beer_id: beer.beer_id,
        embedding: beer.embedding,
      })
    );

    // Evaluate cluster quality
    const { isValid, clusterSizes } = await evaluateClusterQuality(
      result.centroids,
      candidateEmbeddings,
      minItemsPerCluster,
      similarityThreshold
    );

    console.log(
      `k=${k}: cluster sizes = [${clusterSizes.join(', ')}], valid = ${isValid}`
    );

    // Check if this k is valid
    if (isValid) {
      // Also check if we can get enough total recommendations
      const totalPotentialRecs = clusterSizes.reduce((sum, size) => sum + size, 0);

      if (totalPotentialRecs >= minTotalRecommendations) {
        console.log(`k=${k} is valid with ${totalPotentialRecs} potential recommendations`);
        // Store this as the best result so far
        bestResult = {
          ...result,
          k,
          clusterSizes,
        };
        // Continue to try higher k values
      } else {
        console.log(
          `k=${k} is valid but only has ${totalPotentialRecs} potential recs (need ${minTotalRecommendations})`
        );
        // This k doesn't meet minimum recommendations, stop here
        break;
      }
    } else {
      // Found a k that doesn't work, stop and return the last valid k
      console.log(`k=${k} is invalid, stopping search`);
      break;
    }
  }

  // If we found a valid k, return it
  if (bestResult) {
    console.log(`Selected k=${bestResult.k} as the maximum valid k`);
    return bestResult;
  }

  // Fallback to k=1 if nothing works
  console.log('No valid k found, falling back to k=1');
  const fallbackResult = weightedKMeans(beers, 1);

  // Use pre-fetched candidates for k=1 if available
  const k1Candidates = candidatesByK['k1'];
  const candidateEmbeddings = k1Candidates ? k1Candidates.map(beer => ({
    beer_id: beer.beer_id,
    embedding: beer.embedding,
  })) : [];

  const { clusterSizes } = await evaluateClusterQuality(
    fallbackResult.centroids,
    candidateEmbeddings.length > 0 ? candidateEmbeddings : undefined,
    0, // No minimum for fallback
    0 // No threshold for fallback
  );

  return {
    ...fallbackResult,
    k: 1,
    clusterSizes,
  };
}

/**
 * Adaptively select the best k value by trying different values
 * and checking cluster quality. Finds the MAXIMUM k where all clusters
 * still have enough items (stops at the last valid k before failure).
 * @param beers - Rated beers with embeddings
 * @param candidates - Candidate beers for quality evaluation
 * @param kRange - Array of k values to try (default [1,2,3,4,5])
 * @param minItemsPerCluster - Minimum items per cluster (default 5)
 * @param similarityThreshold - Similarity threshold for cluster membership (default 0.7)
 * @param minTotalRecommendations - Minimum total recommendations to return (default 12)
 * @returns ClusterResult with the best k value
 */
export async function adaptiveKMeans(
  beers: BeerEmbedding[],
  userId: string | null,
  kRange: number[] = [1, 2, 3, 4, 5],
  minItemsPerCluster: number = 5,
  similarityThreshold: number = 0.7,
  minTotalRecommendations: number = 12
): Promise<ClusterResult & { k: number; clusterSizes: number[] }> {
  console.log('Starting adaptive k-means selection...');

  let bestResult: (ClusterResult & { k: number; clusterSizes: number[] }) | null = null;

  for (const k of kRange) {
    // Can't have more clusters than beers
    if (k > beers.length) {
      console.log(`Skipping k=${k} (more than ${beers.length} rated beers)`);
      continue;
    }

    console.log(`Trying k=${k}...`);

    // Run k-means clustering
    const result = weightedKMeans(beers, k);

    const candidates = await fetch('/api/recommendations/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centroids: result.centroids,
          userId,
          beersPerCentroid: 200,
          showInactive: false,
        }),
      });

      if (!candidates) {
        throw new Error('Failed to fetch candidates');
      }

      const candidateResponse: CandidateBeer[] = await candidates.json();

      const candidateEmbeddings: BeerEmbedding[] = candidateResponse.map(
        (beer) => ({
          beer_id: beer.beer_id,
          embedding: beer.embedding,
        })
      );

    // Evaluate cluster quality
    const { isValid, clusterSizes } = await evaluateClusterQuality(
      result.centroids,
      candidateEmbeddings,
      minItemsPerCluster,
      similarityThreshold
    );

    console.log(
      `k=${k}: cluster sizes = [${clusterSizes.join(', ')}], valid = ${isValid}`
    );

    // Check if this k is valid
    if (isValid) {
      // Also check if we can get enough total recommendations
      const totalPotentialRecs = clusterSizes.reduce((sum, size) => sum + size, 0);

      if (totalPotentialRecs >= minTotalRecommendations) {
        console.log(`k=${k} is valid with ${totalPotentialRecs} potential recommendations`);
        // Store this as the best result so far
        bestResult = {
          ...result,
          k,
          clusterSizes,
        };
        // Continue to try higher k values
      } else {
        console.log(
          `k=${k} is valid but only has ${totalPotentialRecs} potential recs (need ${minTotalRecommendations})`
        );
        // This k doesn't meet minimum recommendations, stop here
        break;
      }
    } else {
      // Found a k that doesn't work, stop and return the last valid k
      console.log(`k=${k} is invalid, stopping search`);
      break;
    }
  }

  // If we found a valid k, return it
  if (bestResult) {
    console.log(`Selected k=${bestResult.k} as the maximum valid k`);
    return bestResult;
  }

  // Fallback to k=1 if nothing works
  console.log('No valid k found, falling back to k=1');
  const fallbackResult = weightedKMeans(beers, 1);
  const { clusterSizes } = await evaluateClusterQuality(
    fallbackResult.centroids,
    undefined, // Let the function fetch candidates automatically
    0, // No minimum for fallback
    0, // No threshold for fallback
    userId, // Pass userId for candidate fetching
    200 // beersPerCentroid
  );

  return {
    ...fallbackResult,
    k: 1,
    clusterSizes,
  };
}
