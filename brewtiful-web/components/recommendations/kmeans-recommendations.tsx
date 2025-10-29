'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  adaptiveKMeans,
  recommendFromCentroids,
  type BeerEmbedding,
} from '@/lib/recommendations/kmeans';
import type {
  RatedBeer,
  CandidateBeer,
} from '@/lib/recommendations/user-kmeans';
import { BeerCard } from '@/components/beer/beer-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface KMeansRecommendationsProps {
  ratedBeers: RatedBeer[];
  userId: string | null;
}

export function KMeansRecommendations({
  ratedBeers: initialRatedBeers,
  userId,
}: KMeansRecommendationsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<CandidateBeer[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);

  // Cache candidates and cluster results to avoid re-computation
  const [cachedCandidates, setCachedCandidates] = useState<CandidateBeer[]>([]);
  const [cachedCentroids, setCachedCentroids] = useState<number[][] | null>(null);
  const [isClusteringDone, setIsClusteringDone] = useState(false);

  const RECS_PER_PAGE = 12;

  // Effect 1: Compute clusters and fetch candidates once
  useEffect(() => {
    async function computeClusters() {
      setIsLoading(true);
      setIsClusteringDone(false);

      try {
        const ratedBeers = initialRatedBeers;

        if (ratedBeers.length === 0) {
          setIsLoading(false);
          return;
        }

        // Convert rated beers to BeerEmbedding format
        const ratedEmbeddings: BeerEmbedding[] = ratedBeers.map((beer) => ({
          beer_id: beer.beer_id,
          embedding: beer.embedding,
          rating: beer.rating,
        }));

        console.log('Computing clusters for', ratedEmbeddings.length, 'rated beers');

        // Phase 1: Fetch initial candidates for cluster quality evaluation
        const initialK = Math.min(5, ratedBeers.length);
        const initialCentroids = Array(initialK).fill(null).map((_, i) =>
          ratedEmbeddings[Math.floor(i * ratedEmbeddings.length / initialK)].embedding
        );

        const initialResponse = await fetch('/api/recommendations/candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            centroids: initialCentroids,
            userId,
            beersPerCentroid: 50,
            showInactive: false,
          }),
        });

        if (!initialResponse.ok) {
          throw new Error('Failed to fetch initial candidates');
        }

        const initialCandidates: CandidateBeer[] = await initialResponse.json();
        console.log('Fetched initial candidates:', initialCandidates.length);

        const initialCandidateEmbeddings: BeerEmbedding[] = initialCandidates.map(
          (beer) => ({
            beer_id: beer.beer_id,
            embedding: beer.embedding,
          })
        );

        // Phase 2: Use adaptive k-means to find best k value
        const result = adaptiveKMeans(
          ratedEmbeddings,
          initialCandidateEmbeddings,
          [1, 2, 3, 4, 5],
          5,
          0.7,
          12
        );

        console.log(`Adaptive k-means selected k=${result.k}`);
        console.log('Cluster sizes:', result.clusterSizes);

        setCachedCentroids(result.centroids);

        // Phase 3: Fetch enough candidates for ALL pages
        // Fetch more candidates per centroid to support pagination
        const beersPerCentroid = 100; // Fetch enough for many pages

        const finalResponse = await fetch('/api/recommendations/candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            centroids: result.centroids,
            userId,
            beersPerCentroid,
            showInactive: false,
          }),
        });

        if (!finalResponse.ok) {
          throw new Error('Failed to fetch final candidates');
        }

        const candidateBeers: CandidateBeer[] = await finalResponse.json();
        console.log('Fetched final candidates:', candidateBeers.length);

        setCachedCandidates(candidateBeers);
        setIsClusteringDone(true);
      } catch (error) {
        console.error('Error computing clusters:', error);
      } finally {
        setIsLoading(false);
      }
    }

    computeClusters();
  }, [initialRatedBeers, userId]);

  // Effect 2: Compute paginated recommendations when page changes
  useEffect(() => {
    if (!isClusteringDone || !cachedCentroids || cachedCandidates.length === 0) {
      return;
    }

    console.log('Computing page', currentPage, 'from cached candidates');

    // Convert candidate beers to BeerEmbedding format
    const candidateEmbeddings: BeerEmbedding[] = cachedCandidates.map(
      (beer) => ({
        beer_id: beer.beer_id,
        embedding: beer.embedding,
      })
    );

    // Calculate offset based on current page
    const offset = (currentPage - 1) * RECS_PER_PAGE;

    const recommendResult = recommendFromCentroids(
      cachedCentroids,
      candidateEmbeddings,
      RECS_PER_PAGE,
      offset
    );

    console.log(`Page ${currentPage}: ${recommendResult.recommendations.length} recommendations, has more: ${recommendResult.hasMore}, total: ${recommendResult.totalAvailable}`);

    // Map back to full candidate beer objects
    const recommendedBeers = recommendResult.recommendations
      .map((emb) =>
        cachedCandidates.find((b) => b.beer_id === emb.beer_id)
      )
      .filter((b): b is CandidateBeer => b !== undefined);

    setRecommendations(recommendedBeers);
    setHasMore(recommendResult.hasMore);
    setTotalAvailable(recommendResult.totalAvailable);

    console.log('State updated:', {
      currentPage,
      recommendationsCount: recommendedBeers.length,
      hasMore: recommendResult.hasMore,
      totalAvailable: recommendResult.totalAvailable,
      shouldShowPagination: recommendResult.totalAvailable > RECS_PER_PAGE
    });
  }, [currentPage, isClusteringDone, cachedCentroids, cachedCandidates, RECS_PER_PAGE]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Computing recommendations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      <div>
        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No recommendations found. Try rating more beers to build a stronger taste profile!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recommendations.map((beer) => (
                <BeerCard
                  key={beer.beer_id}
                  beerId={beer.beer_id.toString()}
                  name={beer.name}
                  brewery={beer.brewery_name || 'Unknown Brewery'}
                  breweryId={beer.brewery_id || 0}
                  style={beer.style}
                  abv={beer.abv ?? undefined}
                  city={beer.brewery_city || undefined}
                  country={beer.brewery_country || undefined}
                  description={beer.description || undefined}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalAvailable > RECS_PER_PAGE && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    router.push(`/recommendations?page=${newPage}`);
                  }}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(totalAvailable / RECS_PER_PAGE)}
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = currentPage + 1;
                    router.push(`/recommendations?page=${newPage}`);
                  }}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
