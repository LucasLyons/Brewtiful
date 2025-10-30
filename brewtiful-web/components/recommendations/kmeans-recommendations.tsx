'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  adaptiveKMeans,
  recommendFromCentroids,
  selectDiverseSeeds,
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
        // Use k-means++ style selection to pick 5 diverse seed beers
        const numSeeds = 5;
        const seedBeers = selectDiverseSeeds(ratedEmbeddings, numSeeds);
        const seedEmbeddings = seedBeers.map(beer => beer.embedding);

        console.log('Selected', seedBeers.length, 'diverse seed beers for initial candidate fetching');

        const initialResponse = await fetch('/api/recommendations/candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            centroids: seedEmbeddings,
            userId,
            beersPerCentroid: 2500,
            showInactive: false,
          }),
        });

        if (!initialResponse.ok) {
          throw new Error('Failed to fetch initial candidates');
        }

        const initialCandidates: CandidateBeer[] = await initialResponse.json();

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
          [1, 2, 5, 7, 10, 15],
          5,
          0.6,
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
    // Map back to full candidate beer objects
    const recommendedBeers = recommendResult.recommendations
      .map((emb) =>
        cachedCandidates.find((b) => b.beer_id === emb.beer_id)
      )
      .filter((b): b is CandidateBeer => b !== undefined);

    setRecommendations(recommendedBeers);
    setHasMore(recommendResult.hasMore);
    setTotalAvailable(recommendResult.totalAvailable);

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
            {totalAvailable > RECS_PER_PAGE && (() => {
              const totalPages = Math.ceil(totalAvailable / RECS_PER_PAGE);

              const getPageNumbers = () => {
                const pages: (number | string)[] = [];
                const maxVisible = 7;

                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);

                  const showLeftEllipsis = currentPage > 3;
                  const showRightEllipsis = currentPage < totalPages - 2;

                  if (showLeftEllipsis) {
                    pages.push('...');
                  }

                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);

                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }

                  if (showRightEllipsis) {
                    pages.push('...');
                  }

                  if (totalPages > 1) {
                    pages.push(totalPages);
                  }
                }

                return pages;
              };

              return (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      router.push(`/recommendations?page=1`);
                    }}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      router.push(`/recommendations?page=${newPage}`);
                    }}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2">
                            ...
                          </span>
                        );
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => {
                            router.push(`/recommendations?page=${page}`);
                          }}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newPage = currentPage + 1;
                      router.push(`/recommendations?page=${newPage}`);
                    }}
                    disabled={!hasMore}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      router.push(`/recommendations?page=${totalPages}`);
                    }}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                  </Button>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
