'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { RecommendationsFiltersSidebar } from './recommendations-filters-sidebar';

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

  // Get filter params from URL - memoize to prevent unnecessary re-renders
  const filterBreweries = useMemo(
    () => searchParams.get('breweries')?.split(',').filter(Boolean) || [],
    [searchParams]
  );
  const filterStyles = useMemo(
    () => searchParams.get('styles')?.split(',').filter(Boolean) || [],
    [searchParams]
  );
  const filterLocations = useMemo(
    () => searchParams.get('locations')?.split(',').filter(Boolean) || [],
    [searchParams]
  );
  const filterCities = useMemo(
    () => searchParams.get('cities')?.split(',').filter(Boolean) || [],
    [searchParams]
  );
  const abvMin = searchParams.get('abvMin') ? parseFloat(searchParams.get('abvMin')!) : undefined;
  const abvMax = searchParams.get('abvMax') ? parseFloat(searchParams.get('abvMax')!) : undefined;
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const includeUnknown = searchParams.get('includeUnknown') !== 'false';

  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Computing recommendations...');
  const [recommendations, setRecommendations] = useState<CandidateBeer[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Map<number, boolean>>(new Map());
  const [ratings, setRatings] = useState<Map<number, number>>(new Map());

  // Cache candidates to avoid re-computation
  const [cachedCandidates, setCachedCandidates] = useState<CandidateBeer[]>([]);
  const [isClusteringDone, setIsClusteringDone] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const RECS_PER_PAGE = 12;

  // Calculate available filter options based on current filters
  // Using useMemo to avoid recalculating on every render
  const availableBreweries = useMemo(() => {
    // Apply all filters EXCEPT brewery filter
    let filtered = cachedCandidates;

    if (filterStyles.length > 0) {
      filtered = filtered.filter((beer) => filterStyles.includes(beer.style));
    }
    if (filterLocations.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_country && filterLocations.includes(beer.brewery_country));
    }
    if (filterCities.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_city && filterCities.includes(beer.brewery_city));
    }
    if (abvMin !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv >= abvMin);
    }
    if (abvMax !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv <= abvMax);
    }

    return Array.from(
      new Set(filtered.map((b) => b.brewery_name).filter(Boolean))
    ).sort() as string[];
  }, [cachedCandidates, filterStyles, filterLocations, filterCities, abvMin, abvMax]);

  const availableStyles = useMemo(() => {
    // Apply all filters EXCEPT style filter
    let filtered = cachedCandidates;

    if (filterBreweries.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_name && filterBreweries.includes(beer.brewery_name));
    }
    if (filterLocations.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_country && filterLocations.includes(beer.brewery_country));
    }
    if (filterCities.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_city && filterCities.includes(beer.brewery_city));
    }
    if (abvMin !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv >= abvMin);
    }
    if (abvMax !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv <= abvMax);
    }

    return Array.from(
      new Set(filtered.map((b) => b.style).filter(Boolean))
    ).sort() as string[];
  }, [cachedCandidates, filterBreweries, filterLocations, filterCities, abvMin, abvMax]);

  const availableLocations = useMemo(() => {
    // Apply all filters EXCEPT location filter
    let filtered = cachedCandidates;

    if (filterBreweries.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_name && filterBreweries.includes(beer.brewery_name));
    }
    if (filterStyles.length > 0) {
      filtered = filtered.filter((beer) => filterStyles.includes(beer.style));
    }
    if (filterCities.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_city && filterCities.includes(beer.brewery_city));
    }
    if (abvMin !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv >= abvMin);
    }
    if (abvMax !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv <= abvMax);
    }

    return Array.from(
      new Set(filtered.map((b) => b.brewery_country).filter(Boolean))
    ).sort() as string[];
  }, [cachedCandidates, filterBreweries, filterStyles, filterCities, abvMin, abvMax]);

  const availableCities = useMemo(() => {
    // Apply all filters EXCEPT city filter
    let filtered = cachedCandidates;

    if (filterBreweries.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_name && filterBreweries.includes(beer.brewery_name));
    }
    if (filterStyles.length > 0) {
      filtered = filtered.filter((beer) => filterStyles.includes(beer.style));
    }
    if (filterLocations.length > 0) {
      filtered = filtered.filter((beer) => beer.brewery_country && filterLocations.includes(beer.brewery_country));
    }
    if (abvMin !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv >= abvMin);
    }
    if (abvMax !== undefined) {
      filtered = filtered.filter((beer) => beer.abv !== null && beer.abv <= abvMax);
    }

    return Array.from(
      new Set(filtered.map((b) => b.brewery_city).filter(Boolean))
    ).sort() as string[];
  }, [cachedCandidates, filterBreweries, filterStyles, filterLocations, abvMin, abvMax]);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("recommendationsFiltersSidebarOpen");
    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    }
  }, []);

  // Save sidebar state to localStorage
  const handleToggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("recommendationsFiltersSidebarOpen", String(newState));
  };

  // Helper function to build URL with all current search params
  const buildUrlWithPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `/recommendations?${params.toString()}`;
  };

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
          console.log('✅ Cache hit - loaded recommendations from localStorage');
          setLoadingMessage('Using cached candidates (without embeddings for faster load)');

          // Cast cached data (without embeddings) to CandidateBeer type
          candidatesByK = cachedCandidatesByK as unknown as Record<string, CandidateBeer[]>;

          // When using cache, pick the best available k value
          // Prefer higher k for more diversity, but ensure we have candidates
          const availableKs = Object.keys(candidatesByK)
            .map(k => parseInt(k.replace('k', '')))
            .filter(k => candidatesByK[`k${k}`]?.length > 0)
            .sort((a, b) => b - a); // Sort descending (highest k first)

          if (availableKs.length === 0) {
            throw new Error('No valid cached candidates found');
          }

          const selectedK = availableKs[0]; // Use highest k available
          console.log(`Using cached k=${selectedK} (from cache, no re-evaluation needed)`);

          // Get candidates for selected k (already have cluster assignments)
          const selectedKKey = `k${selectedK}`;
          const finalCandidates = candidatesByK[selectedKKey] || [];

          console.log('Using cached candidates:', finalCandidates.length);

          setCachedCandidates(finalCandidates);
          setIsClusteringDone(true);
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

          // Phase 2: Use adaptive k-means with pre-fetched candidates and centroids
          setLoadingMessage('Optimizing cluster quality...');
          const result = await adaptiveKMeansWithPrefetch(
            ratedEmbeddings,
            candidatesByK,
            K_RANGE,
            5,
            0.5,
            12,
            centroidsByK // Pass pre-computed centroids to avoid re-computing
          );

          console.log(`Adaptive k-means selected k=${result.k}`);

          // Phase 3: Get final candidates for selected k
          setLoadingMessage('Preparing recommendations...');
          const selectedK = `k${result.k}`;
          const finalCandidates = candidatesByK[selectedK] || [];

          console.log('Using final candidates:', finalCandidates.length);

          setCachedCandidates(finalCandidates);
          setIsClusteringDone(true);
        }
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

  // Effect 2: Compute paginated recommendations when page changes or filters change
  useEffect(() => {
    if (!isClusteringDone || cachedCandidates.length === 0) {
      return;
    }

    // Apply filters to cached candidates
    let filteredCandidates = cachedCandidates;

    // Filter by brewery
    if (filterBreweries.length > 0) {
      filteredCandidates = filteredCandidates.filter((beer) =>
        beer.brewery_name && filterBreweries.includes(beer.brewery_name)
      );
    }

    // Filter by style
    if (filterStyles.length > 0) {
      filteredCandidates = filteredCandidates.filter((beer) =>
        filterStyles.includes(beer.style)
      );
    }

    // Filter by country
    if (filterLocations.length > 0) {
      filteredCandidates = filteredCandidates.filter((beer) =>
        beer.brewery_country && filterLocations.includes(beer.brewery_country)
      );
    }

    // Filter by city
    if (filterCities.length > 0) {
      filteredCandidates = filteredCandidates.filter((beer) =>
        beer.brewery_city && filterCities.includes(beer.brewery_city)
      );
    }

    // Filter by ABV range
    if (abvMin !== undefined) {
      filteredCandidates = filteredCandidates.filter((beer) =>
        beer.abv !== null && beer.abv >= abvMin
      );
    }
    if (abvMax !== undefined) {
      filteredCandidates = filteredCandidates.filter((beer) =>
        beer.abv !== null && beer.abv <= abvMax
      );
    }

    // Filter by active status
    // Candidates don't have active_status field, so we'll need to fetch it
    // For now, we'll skip this filter for candidates that don't have the field
    // The API should already be filtering by active status

    // Calculate offset based on current page
    const offset = (currentPage - 1) * RECS_PER_PAGE;

    // Get rated beer IDs for seeding
    const ratedBeerIds = initialRatedBeers.map(beer => beer.beer_id);

    // Use diverse ranking with filtered candidates that include quality fields
    const recommendResult = recommendFromCentroids(
      filteredCandidates, // Includes similarity, cluster_index, bias_term, scraped_review_count
      userId,
      ratedBeerIds,
      RECS_PER_PAGE,
      offset,
      RANKING_PARAMS
    );

    setRecommendations(recommendResult.recommendations);
    setHasMore(recommendResult.hasMore);
    setTotalAvailable(recommendResult.totalAvailable);

  }, [
    currentPage,
    isClusteringDone,
    cachedCandidates,
    userId,
    initialRatedBeers,
    filterBreweries,
    filterStyles,
    filterLocations,
    filterCities,
    abvMin,
    abvMax,
    includeInactive,
    includeUnknown
  ]);

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
    <>
      <RecommendationsFiltersSidebar
        availableBreweries={availableBreweries}
        availableStyles={availableStyles}
        availableLocations={availableLocations}
        availableCities={availableCities}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
      />
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Recommendations</h1>
            <p className="text-muted-foreground">
              Personalized beer recommendations based on your tastes!
            </p>
          </div>

          {/* Recommendations */}
          <div>
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {totalAvailable === 0 && cachedCandidates.length > 0
                      ? "No recommendations match your current filters. Try adjusting or resetting your filters."
                      : "No recommendations found. Try rating more beers to build a stronger taste profile!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
          <>
            {/* Result count display */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {(currentPage - 1) * RECS_PER_PAGE + 1}-{Math.min(currentPage * RECS_PER_PAGE, totalAvailable)} of {totalAvailable} recommendations
              {(filterBreweries.length > 0 || filterStyles.length > 0 || filterLocations.length > 0 || filterCities.length > 0 || abvMin !== undefined || abvMax !== undefined) && ' (filtered)'}
            </div>

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
                      router.push(buildUrlWithPage(1));
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
                      router.push(buildUrlWithPage(newPage));
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
                            router.push(buildUrlWithPage(page as number));
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
                      router.push(buildUrlWithPage(newPage));
                    }}
                    disabled={!hasMore}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      router.push(buildUrlWithPage(totalPages));
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
      </div>
    </>
  );
}
