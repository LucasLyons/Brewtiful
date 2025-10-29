import { NextRequest, NextResponse } from 'next/server';
import { getCandidateBeersFromCentroids } from '@/lib/recommendations/user-kmeans';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { centroids, userId, beersPerCentroid, showInactive } = body;

    // Validate input
    if (!centroids || !Array.isArray(centroids)) {
      return NextResponse.json(
        { error: 'Invalid centroids' },
        { status: 400 }
      );
    }

    // Fetch candidate beers using pgvector
    const candidateBeers = await getCandidateBeersFromCentroids(
      centroids,
      userId || null,
      beersPerCentroid || 10,
      showInactive || false
    );

    return NextResponse.json(candidateBeers);
  } catch (error) {
    console.error('Error fetching candidate beers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate beers' },
      { status: 500 }
    );
  }
}
