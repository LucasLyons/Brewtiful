/**
 * K-means clustering utilities for beer recommendations
 * Uses weighted k-means with rating weights to find beer taste clusters
 */

export interface BeerEmbedding {
  beer_id: number;
  embedding: number[];
  rating?: number;
}

export interface ClusterResult {
  centroids: number[][];
  assignments: number[];
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
 */
function initializeCentroids(
  beers: BeerEmbedding[],
  k: number
): number[][] {
  const centroids: number[][] = [];

  // Choose first centroid randomly
  const firstIdx = Math.floor(Math.random() * beers.length);
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
    let random = Math.random() * totalDist;

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
 */
export function weightedKMeans(
  beers: BeerEmbedding[],
  k: number = 3,
  maxIterations: number = 100,
  tolerance: number = 1e-4
): ClusterResult {
  if (beers.length === 0) {
    throw new Error('No beers provided for clustering');
  }

  if (k > beers.length) {
    k = beers.length;
  }

  const embeddingDim = beers[0].embedding.length;

  // Initialize centroids using k-means++
  let centroids = initializeCentroids(beers, k);
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
 * Find beers most similar to cluster centroids
 * @param centroids - Cluster centroids from k-means
 * @param candidates - Candidate beers to recommend
 * @param beersPerCentroid - Number of beers to recommend per centroid
 */
export function recommendFromCentroids(
  centroids: number[][],
  candidates: BeerEmbedding[],
  beersPerCentroid: number = 4
): BeerEmbedding[] {
  const recommendations = new Map<number, BeerEmbedding>();

  for (const centroid of centroids) {
    const similar = findMostSimilar(centroid, candidates, beersPerCentroid);

    for (const beer of similar) {
      // Only add if not already in recommendations (avoid duplicates)
      if (!recommendations.has(beer.beer_id)) {
        recommendations.set(beer.beer_id, beer);
      }
    }
  }

  return Array.from(recommendations.values());
}
