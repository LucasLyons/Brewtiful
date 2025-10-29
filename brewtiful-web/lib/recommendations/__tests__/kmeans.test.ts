/**
 * Tests for k-means clustering and recommendation functions
 */

import { recommendFromCentroids, type BeerEmbedding } from '../kmeans';

describe('recommendFromCentroids', () => {
  it('should recommend 1 beer per cluster in round-robin fashion', () => {
    // Create 3 centroids
    const centroids = [
      [1, 0, 0], // Centroid 1
      [0, 1, 0], // Centroid 2
      [0, 0, 1], // Centroid 3
    ];

    // Create 30 candidate beers (10 similar to each centroid)
    const candidates: BeerEmbedding[] = [];

    // 10 beers similar to centroid 1
    for (let i = 0; i < 10; i++) {
      candidates.push({
        beer_id: 100 + i,
        embedding: [0.9 - i * 0.05, 0.1, 0.1],
      });
    }

    // 10 beers similar to centroid 2
    for (let i = 0; i < 10; i++) {
      candidates.push({
        beer_id: 200 + i,
        embedding: [0.1, 0.9 - i * 0.05, 0.1],
      });
    }

    // 10 beers similar to centroid 3
    for (let i = 0; i < 10; i++) {
      candidates.push({
        beer_id: 300 + i,
        embedding: [0.1, 0.1, 0.9 - i * 0.05],
      });
    }

    // Get 12 recommendations
    const recommendations = recommendFromCentroids(centroids, candidates, 12);

    // Should get exactly 12 recommendations
    expect(recommendations.length).toBe(12);

    // Check round-robin pattern:
    // Round 1: cluster 0, cluster 1, cluster 2 (beers 0-2)
    // Round 2: cluster 0, cluster 1, cluster 2 (beers 3-5)
    // Round 3: cluster 0, cluster 1, cluster 2 (beers 6-8)
    // Round 4: cluster 0, cluster 1, cluster 2 (beers 9-11)

    // Round 1
    expect(recommendations[0].beer_id).toBe(100); // Cluster 1, best beer
    expect(recommendations[1].beer_id).toBe(200); // Cluster 2, best beer
    expect(recommendations[2].beer_id).toBe(300); // Cluster 3, best beer

    // Round 2
    expect(recommendations[3].beer_id).toBe(101); // Cluster 1, 2nd best beer
    expect(recommendations[4].beer_id).toBe(201); // Cluster 2, 2nd best beer
    expect(recommendations[5].beer_id).toBe(301); // Cluster 3, 2nd best beer

    // Round 3
    expect(recommendations[6].beer_id).toBe(102); // Cluster 1, 3rd best beer
    expect(recommendations[7].beer_id).toBe(202); // Cluster 2, 3rd best beer
    expect(recommendations[8].beer_id).toBe(302); // Cluster 3, 3rd best beer

    // Round 4
    expect(recommendations[9].beer_id).toBe(103); // Cluster 1, 4th best beer
    expect(recommendations[10].beer_id).toBe(203); // Cluster 2, 4th best beer
    expect(recommendations[11].beer_id).toBe(304); // Cluster 3, 4th best beer

    // No duplicates
    const uniqueIds = new Set(recommendations.map((r) => r.beer_id));
    expect(uniqueIds.size).toBe(12);
  });

  it('should handle k=5 clusters correctly', () => {
    const centroids = [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];

    // Create 50 candidates (10 per cluster)
    const candidates: BeerEmbedding[] = [];
    for (let cluster = 0; cluster < 5; cluster++) {
      for (let i = 0; i < 10; i++) {
        const embedding = [0.1, 0.1, 0.1, 0.1, 0.1];
        embedding[cluster] = 0.9 - i * 0.05;
        candidates.push({
          beer_id: (cluster + 1) * 100 + i,
          embedding,
        });
      }
    }

    const result = recommendFromCentroids(centroids, candidates, 12, 0);

    // Should get exactly 12 recommendations on first page
    expect(result.recommendations.length).toBe(12);
    expect(result.hasMore).toBe(true);
    // Total should be all unique candidates (100 total: 20 per cluster × 5 clusters)
    expect(result.totalAvailable).toBe(100);

    // With 5 clusters and 12 recommendations:
    // Round 1: 5 beers (1 per cluster) = 5 total
    // Round 2: 5 beers (1 per cluster) = 10 total
    // Round 3: 2 beers (from first 2 clusters) = 12 total

    // Check that we cycle through clusters
    expect(result.recommendations[0].beer_id).toBe(100); // Cluster 0
    expect(result.recommendations[1].beer_id).toBe(200); // Cluster 1
    expect(result.recommendations[2].beer_id).toBe(300); // Cluster 2
    expect(result.recommendations[3].beer_id).toBe(400); // Cluster 3
    expect(result.recommendations[4].beer_id).toBe(500); // Cluster 4

    // Round 2
    expect(result.recommendations[5].beer_id).toBe(101); // Cluster 0
    expect(result.recommendations[6].beer_id).toBe(201); // Cluster 1
    expect(result.recommendations[7].beer_id).toBe(301); // Cluster 2
    expect(result.recommendations[8].beer_id).toBe(401); // Cluster 3
    expect(result.recommendations[9].beer_id).toBe(501); // Cluster 4

    // Round 3 (partial)
    expect(result.recommendations[10].beer_id).toBe(102); // Cluster 0
    expect(result.recommendations[11].beer_id).toBe(202); // Cluster 1
  });

  it('should stop if not enough candidates available', () => {
    const centroids = [
      [1, 0],
      [0, 1],
    ];

    // Only 5 candidates total
    const candidates: BeerEmbedding[] = [
      { beer_id: 1, embedding: [0.9, 0.1] },
      { beer_id: 2, embedding: [0.8, 0.2] },
      { beer_id: 3, embedding: [0.1, 0.9] },
      { beer_id: 4, embedding: [0.2, 0.8] },
      { beer_id: 5, embedding: [0.7, 0.3] },
    ];

    const result = recommendFromCentroids(centroids, candidates, 12, 0);

    // Should only get 5 recommendations (all available candidates)
    expect(result.recommendations.length).toBe(5);
    expect(result.hasMore).toBe(false);
    expect(result.totalAvailable).toBe(5);

    // No duplicates
    const uniqueIds = new Set(result.recommendations.map((r) => r.beer_id));
    expect(uniqueIds.size).toBe(5);
  });

  it('should handle pagination correctly', () => {
    const centroids = [
      [1, 0],
      [0, 1],
    ];

    // Create 20 candidates (10 per cluster)
    const candidates: BeerEmbedding[] = [];
    for (let cluster = 0; cluster < 2; cluster++) {
      for (let i = 0; i < 10; i++) {
        const embedding = cluster === 0 ? [0.9 - i * 0.05, 0.1] : [0.1, 0.9 - i * 0.05];
        candidates.push({
          beer_id: (cluster + 1) * 100 + i,
          embedding,
        });
      }
    }

    // First page (offset 0)
    const page1 = recommendFromCentroids(centroids, candidates, 5, 0);
    expect(page1.recommendations.length).toBe(5);
    expect(page1.hasMore).toBe(true);
    expect(page1.totalAvailable).toBe(20);

    // Check first page IDs (round-robin: cluster 0, cluster 1, cluster 0, cluster 1, cluster 0)
    expect(page1.recommendations[0].beer_id).toBe(100); // Cluster 0
    expect(page1.recommendations[1].beer_id).toBe(200); // Cluster 1
    expect(page1.recommendations[2].beer_id).toBe(101); // Cluster 0
    expect(page1.recommendations[3].beer_id).toBe(201); // Cluster 1
    expect(page1.recommendations[4].beer_id).toBe(102); // Cluster 0

    // Second page (offset 5)
    const page2 = recommendFromCentroids(centroids, candidates, 5, 5);
    expect(page2.recommendations.length).toBe(5);
    expect(page2.hasMore).toBe(true);

    // Check second page IDs continue round-robin
    expect(page2.recommendations[0].beer_id).toBe(202); // Cluster 1
    expect(page2.recommendations[1].beer_id).toBe(103); // Cluster 0
    expect(page2.recommendations[2].beer_id).toBe(203); // Cluster 1
    expect(page2.recommendations[3].beer_id).toBe(104); // Cluster 0
    expect(page2.recommendations[4].beer_id).toBe(204); // Cluster 1

    // Last page (offset 15, only 5 items left)
    const page4 = recommendFromCentroids(centroids, candidates, 5, 15);
    expect(page4.recommendations.length).toBe(5);
    expect(page4.hasMore).toBe(false); // No more items

    // Page beyond available (offset 20)
    const pageBeyond = recommendFromCentroids(centroids, candidates, 5, 20);
    expect(pageBeyond.recommendations.length).toBe(0);
    expect(pageBeyond.hasMore).toBe(false);
  });
});
