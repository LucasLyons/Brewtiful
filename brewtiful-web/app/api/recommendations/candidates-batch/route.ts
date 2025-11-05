import { NextRequest, NextResponse } from 'next/server';
import { getCandidateBeersFromCentroids, type CandidateBeer } from '@/lib/recommendations/user-kmeans';

/**
 * Batch API endpoint for fetching candidates for multiple k values in parallel
 *
 * Accepts an object with k values as keys and centroid arrays as values:
 * {
 *   "k1": [[centroid1]],
 *   "k2": [[centroid1], [centroid2]],
 *   "k5": [[cent1], [cent2], [cent3], [cent4], [cent5]],
 *   ...
 * }
 *
 * Returns an object with the same k values as keys and candidate arrays as values:
 * {
 *   "k1": [CandidateBeer[]],
 *   "k2": [CandidateBeer[]],
 *   "k5": [CandidateBeer[]],
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { centroidsByK, userId, beersPerCentroid, showInactive } = body;

    // Validate input
    if (!centroidsByK || typeof centroidsByK !== 'object') {
      return NextResponse.json(
        { error: 'Invalid centroidsByK - must be an object with k values as keys' },
        { status: 400 }
      );
    }

    // Fetch candidates for all k values in parallel
    const kValues = Object.keys(centroidsByK);
    const fetchPromises = kValues.map(async (k) => {
      const centroids = centroidsByK[k];

      if (!Array.isArray(centroids)) {
        throw new Error(`Invalid centroids for k=${k}`);
      }

      const candidateBeers = await getCandidateBeersFromCentroids(
        centroids,
        userId || null,
        beersPerCentroid || 100,
        showInactive || false
      );

      return { k, candidates: candidateBeers };
    });

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);

    // Transform results into object with k as keys
    const candidatesByK: Record<string, CandidateBeer[]> = {};
    results.forEach(({ k, candidates }) => {
      candidatesByK[k] = candidates;
    });

    return NextResponse.json({
      success: true,
      data: candidatesByK,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching batch candidate beers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candidate beers'
      },
      { status: 500 }
    );
  }
}
