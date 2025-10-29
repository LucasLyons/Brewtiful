'use client';

import { useEffect, useState } from 'react';
import {
  weightedKMeans,
  recommendFromCentroids,
  type BeerEmbedding,
} from '@/lib/recommendations/kmeans';
import type {
  RatedBeer,
  CandidateBeer,
} from '@/lib/recommendations/user-kmeans';
import { BeerCard } from '@/components/beer/beer-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface KMeansRecommendationsProps {
  ratedBeers: RatedBeer[];
  candidateBeers: CandidateBeer[];
  userId: string | null;
}

export function KMeansRecommendations({
  ratedBeers: initialRatedBeers,
  candidateBeers,
  userId,
}: KMeansRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<CandidateBeer[]>([]);
  const [clusters, setClusters] = useState<number>(3);
  const [beersPerCluster, setBeersPerCluster] = useState<number>(4);
  const [clusterInfo, setClusterInfo] = useState<{
    centroids: number[][];
    assignments: number[];
  } | null>(null);

  useEffect(() => {
    async function computeRecommendations() {
      setIsLoading(true);

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

        // Debug: Check embedding dimensions
        console.log('Rated beers count:', ratedEmbeddings.length);
        if (ratedEmbeddings.length > 0) {
          console.log('First embedding length:', ratedEmbeddings[0].embedding.length);
          console.log('First embedding sample:', ratedEmbeddings[0].embedding.slice(0, 5));
        }

        // Perform weighted k-means clustering
        const k = Math.min(clusters, ratedBeers.length);
        const result = weightedKMeans(ratedEmbeddings, k);

        setClusterInfo(result);

        // Convert candidate beers to BeerEmbedding format
        const candidateEmbeddings: BeerEmbedding[] = candidateBeers.map(
          (beer) => ({
            beer_id: beer.beer_id,
            embedding: beer.embedding,
          })
        );

        // Get recommendations from centroids
        const recommendedEmbeddings = recommendFromCentroids(
          result.centroids,
          candidateEmbeddings,
          beersPerCluster
        );

        // Map back to full candidate beer objects
        const recommendedBeers = recommendedEmbeddings
          .map((emb) =>
            candidateBeers.find((b) => b.beer_id === emb.beer_id)
          )
          .filter((b): b is CandidateBeer => b !== undefined);

        setRecommendations(recommendedBeers);
      } catch (error) {
        console.error('Error computing recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    computeRecommendations();
  }, [
    initialRatedBeers,
    candidateBeers,
    userId,
    clusters,
    beersPerCluster,
  ]);

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
      {/* Cluster Info */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendation Algorithm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Using weighted k-means clustering with k={clusters} clusters on{' '}
              {initialRatedBeers.length} rated beers to find {beersPerCluster}{' '}
              recommendations per cluster.
            </p>
          </div>

          {clusterInfo && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Cluster Distribution:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: clusters }, (_, i) => {
                  const count = clusterInfo.assignments.filter(
                    (a) => a === i
                  ).length;
                  return (
                    <Badge key={i} variant="secondary">
                      Cluster {i + 1}: {count} beers
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 pt-4 border-t">
            <div className="flex-1">
              <label
                htmlFor="clusters"
                className="text-sm font-medium block mb-2"
              >
                Number of Clusters (k)
              </label>
              <input
                id="clusters"
                type="number"
                min="1"
                max="10"
                value={clusters}
                onChange={(e) => setClusters(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="beersPerCluster"
                className="text-sm font-medium block mb-2"
              >
                Beers per Cluster
              </label>
              <input
                id="beersPerCluster"
                type="number"
                min="1"
                max="20"
                value={beersPerCluster}
                onChange={(e) => setBeersPerCluster(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Recommended for You ({recommendations.length} beers)
        </h2>

        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No recommendations found. Try adjusting the parameters or rating
                more beers!
              </p>
            </CardContent>
          </Card>
        ) : (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
