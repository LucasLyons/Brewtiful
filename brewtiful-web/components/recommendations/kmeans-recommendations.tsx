'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  adaptiveKMeansWithPrefetch,
  recommendFromCentroids,
  type BeerEmbedding,
} from '@/lib/recommendations/kmeans';
import { RANKING_PARAMS } from '@/lib/recommendations/config';
import type {
  RatedBeer,
  CandidateBeer,
} from '@/lib/recommendations/user-kmeans';
import {
  loadCandidatesFromCache,
  saveCandidatesToCache,
} from '@/lib/recommendations/cache';
import { areBeersSaved } from '@/lib/saved/get-user-saved';
import { getBatchUserRatings } from '@/lib/ratings/get-user-ratings';
import { createClient } from '@/lib/supabase/client';
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
  const [loadingMessage, setLoadingMessage] = useState('Computing recommendations...');
  const [recommendations, setRecommendations] = useState<CandidateBeer[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Map<number, boolean>>(new Map());
  const [ratings, setRatings] = useState<Map<number, number>>(new Map());

  // Cache candidates and cluster results to avoid re-computation
  const [cachedCandidates, setCachedCandidates] = useState<CandidateBeer[]>([]);
  const [cachedCentroids, setCachedCentroids] = useState<number[][] | null>(null);
  const [isClusteringDone, setIsClusteringDone] = useState(false);

  const RECS_PER_PAGE = 12;

  // Effect 1: Compute clusters and fetch candidates once with caching
  useEffect(() => {
    const K_RANGE = [1, 2, 5, 7, 10, 15];
    const BEERS_PER_CENTROID = 72; // 3 pages of 24 items for performance
    async function computeClusters() {
      setIsLoading(true);
      setIsClusteringDone(false);
      setError(null);

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

        const ratedBeerIds = ratedBeers.map(beer => beer.beer_id);

        console.log('Computing clusters for', ratedEmbeddings.length, 'rated beers');

        // Try to load from cache first
        setLoadingMessage('Checking cache...');
        const cachedCandidatesByK = loadCandidatesFromCache(
          userId,
          ratedBeerIds,
          K_RANGE,
          BEERS_PER_CENTROID
        );

        let candidatesByK: Record<string, CandidateBeer[]>;

        if (cachedCandidatesByK) {
          console.log('✅ Using cached candidates');
          setLoadingMessage('Loading from cache...');
          candidatesByK = cachedCandidatesByK;
        } else {
          console.log('📡 Fetching candidates from API...');
          setLoadingMessage('Computing taste clusters...');

          // Pre-compute centroids for all k values
          const centroidsByK: Record<string, number[][]> = {};
          for (const k of K_RANGE) {
            if (k <= ratedEmbeddings.length) {
              // Import weightedKMeans for centroid calculation
              const { weightedKMeans } = await import('@/lib/recommendations/kmeans');
              const result = weightedKMeans(ratedEmbeddings, k);
              centroidsByK[`k${k}`] = result.centroids;
            }
          }

          setLoadingMessage('Fetching candidate beers...');

          // Batch fetch all candidates in parallel
          const batchResponse = await fetch('/api/recommendations/candidates-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              centroidsByK,
              userId,
              beersPerCentroid: BEERS_PER_CENTROID,
              showInactive: false,
            }),
          });

          if (!batchResponse.ok) {
            const errorText = await batchResponse.text();
            throw new Error(`Failed to fetch candidates: ${errorText}`);
          }

          const batchData = await batchResponse.json();

          if (!batchData.success) {
            throw new Error(batchData.error || 'Failed to fetch candidates');
          }

          candidatesByK = batchData.data;

          console.log('✅ Fetched candidates for k values:', Object.keys(candidatesByK));

          // Save to cache
          saveCandidatesToCache(
            userId,
            ratedBeerIds,
            candidatesByK,
            K_RANGE,
            BEERS_PER_CENTROID
          );
        }

        // Phase 2: Use adaptive k-means with pre-fetched candidates
        setLoadingMessage('Optimizing cluster quality...');
        const result = await adaptiveKMeansWithPrefetch(
          ratedEmbeddings,
          candidatesByK,
          K_RANGE,
          5,
          0.65,
          12
        );

        console.log(`Adaptive k-means selected k=${result.k}`);

        setCachedCentroids(result.centroids);

        // Phase 3: Get final candidates for selected k
        setLoadingMessage('Preparing recommendations...');
        const selectedK = `k${result.k}`;
        const finalCandidates = candidatesByK[selectedK] || [];

        console.log('Using final candidates:', finalCandidates.length);

        setCachedCandidates(finalCandidates);
        setIsClusteringDone(true);
      } catch (error) {
        console.error('Error computing clusters:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(`Failed to generate recommendations: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        setLoadingMessage('Computing recommendations...');
      }
    }

    computeClusters();
  }, [initialRatedBeers, userId]);

  // Effect 2: Compute paginated recommendations when page changes
  useEffect(() => {
    if (!isClusteringDone || !cachedCentroids || cachedCandidates.length === 0) {
      return;
    }

    // Calculate offset based on current page
    const offset = (currentPage - 1) * RECS_PER_PAGE;

    // Get rated beer IDs for seeding
    const ratedBeerIds = initialRatedBeers.map(beer => beer.beer_id);

    // Use new diverse ranking with candidates that include quality fields
    const recommendResult = recommendFromCentroids(
      cachedCentroids,
      cachedCandidates, // Now includes similarity, cluster_index, bias_term, scraped_review_count
      userId,
      ratedBeerIds,
      RECS_PER_PAGE,
      offset,
      RANKING_PARAMS
    );

    setRecommendations(recommendResult.recommendations);
    setHasMore(recommendResult.hasMore);
    setTotalAvailable(recommendResult.totalAvailable);

  }, [currentPage, isClusteringDone, cachedCentroids, cachedCandidates, RECS_PER_PAGE, userId, initialRatedBeers]);

  // Effect 3: Batch fetch saved states and ratings when recommendations change
  useEffect(() => {
    async function fetchUserData() {
      if (recommendations.length === 0 || !userId) {
        setSavedStates(new Map());
        setRatings(new Map());
        return;
      }

      const supabase = createClient();

      // Get current user to ensure still authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSavedStates(new Map());
        setRatings(new Map());
        return;
      }

      const beerIds = recommendations.map(beer => beer.beer_id);

      // Batch fetch both saved states and ratings in parallel
      const [savedMap, ratingsMap] = await Promise.all([
        areBeersSaved(beerIds, user.id),
        getBatchUserRatings(beerIds, user.id)
      ]);

      setSavedStates(savedMap);
      setRatings(ratingsMap);
    }

    fetchUserData();
  }, [recommendations, userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          {loadingMessage}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">
              {error}
            </p>
            <Button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
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
                  isSaved={savedStates.get(beer.beer_id) ?? false}
                  initialRating={ratings.get(beer.beer_id) ?? null}
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
