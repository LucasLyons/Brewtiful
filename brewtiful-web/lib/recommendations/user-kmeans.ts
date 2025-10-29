/**
 * Server-side functions for k-means based user recommendations
 */

import { createClient } from '@/lib/supabase/server';
export interface RatedBeer {
  beer_id: number;
  rating: number;
  embedding: number[];
  name: string;
  style: string;
  brewery_name?: string;
}

export interface CandidateBeer {
  beer_id: number;
  embedding: number[];
  name: string;
  style: string;
  abv: number | null;
  brewery_id: number | null;
  brewery_name?: string;
  brewery_city?: string;
  brewery_country?: string;
  description?: string;
}

/**
 * Fetch user's rated beers with embeddings
 * @param userId - User ID (null for anonymous users)
 * @returns Array of rated beers with embeddings
 */
export async function getUserRatedBeersWithEmbeddings(
  userId: string | null
): Promise<RatedBeer[]> {
  const supabase = await createClient();

  // Build query for user ratings
  let ratingsQuery = supabase
    .from('user_ratings')
    .select(
      `
      beer_id,
      rating,
      beers (
        beer_id,
        name,
        style,
        brewery:breweries!beers_brewery_id_fkey (
          name
        ),
        beer_embeddings (
          embedding
        )
      )
    `
    );

  // Filter by user_id
  if (userId) {
    ratingsQuery = ratingsQuery.eq('user_id', userId);
  } else {
    return [];
  }

  const { data: ratings, error } = await ratingsQuery;

  if (error) {
    console.error('Error fetching rated beers:', error);
    return [];
  }

  if (!ratings || ratings.length === 0) {
    return [];
  }

  // Transform the data
  const ratedBeers: RatedBeer[] = ratings
    .filter((r) => {
      // Ensure we have all required data
      const beer = Array.isArray(r.beers) ? r.beers[0] : r.beers;
      if (!beer) return false;

      const beerEmbeddings = Array.isArray(beer.beer_embeddings)
        ? beer.beer_embeddings[0]
        : beer.beer_embeddings;

      if (!beerEmbeddings || !beerEmbeddings.embedding) return false;

      // Parse pgvector string to array if needed
      let embedding = beerEmbeddings.embedding;

      // If embedding is a string (pgvector format), parse it
      if (typeof embedding === 'string') {
        try {
          // pgvector format: "[1,2,3,...]"
          embedding = JSON.parse(embedding);
        } catch (e) {
          console.warn(`Beer ${r.beer_id} has unparseable embedding:`, e);
          return false;
        }
      }

      // After parsing, check if it's an array
      if (!Array.isArray(embedding)) {
        console.warn(`Beer ${r.beer_id} has non-array embedding after parsing:`, typeof embedding);
        return false;
      }

      if (embedding.length !== 103) {
        console.warn(`Beer ${r.beer_id} has incorrect embedding length: ${embedding.length} (expected 103)`);
        return false;
      }

      return true;
    })
    .map((r) => {
      const beer = Array.isArray(r.beers) ? r.beers[0] : r.beers;
      const beerEmbeddings = Array.isArray(beer.beer_embeddings)
        ? beer.beer_embeddings[0]
        : beer.beer_embeddings;
      const brewery = Array.isArray(beer.brewery)
        ? beer.brewery[0]
        : beer.brewery;

      // Parse embedding if it's a string
      let embedding = beerEmbeddings.embedding;
      if (typeof embedding === 'string') {
        embedding = JSON.parse(embedding);
      }

      return {
        beer_id: r.beer_id,
        rating: r.rating,
        embedding: embedding,
        name: beer.name,
        style: beer.style,
        brewery_name: brewery?.name,
      };
    });

  return ratedBeers;
}

/**
 * Fetch candidate beers for recommendations using pgvector similarity to centroids
 * @param centroids - Array of centroid vectors from k-means clustering
 * @param userId - User ID to exclude rated beers (null for anonymous users)
 * @param beersPerCentroid - Number of beers to fetch per centroid (default 10)
 * @param showInactive - Whether to include inactive beers (default false)
 * @returns Array of candidate beers with embeddings
 */
export async function getCandidateBeersFromCentroids(
  centroids: number[][],
  userId: string | null,
  beersPerCentroid: number = 10,
  showInactive: boolean = false
): Promise<CandidateBeer[]> {
  const supabase = await createClient();

  // First, get user's rated beer IDs to exclude
  let ratingsQuery = supabase.from('user_ratings').select('beer_id');

  if (userId) {
    ratingsQuery = ratingsQuery.eq('user_id', userId);
  }

  const { data: ratedBeers } = await ratingsQuery;
  const ratedBeerIds = ratedBeers?.map((r) => r.beer_id) || [];

  // Convert centroids to pgvector format strings
  const centroidVectors = centroids.map((c) => `[${c.join(',')}]`);

  // Call RPC function to get similar beers for each centroid
  const { data: similarBeers, error: rpcError } = await supabase.rpc(
    'get_beers_similar_to_centroids',
    {
      centroid_vectors: centroidVectors,
      beers_per_centroid: beersPerCentroid,
      show_inactive: showInactive,
    }
  );

  if (rpcError) {
    console.error('Error fetching beers similar to centroids:', rpcError);
    return [];
  }

  if (!similarBeers || similarBeers.length === 0) {
    return [];
  }

  // Get unique beer IDs, excluding rated beers
  const uniqueBeerIds = Array.from(
    new Set(
      similarBeers
        .map((sb: { beer_id: number }) => sb.beer_id)
        .filter((id: number) => !ratedBeerIds.includes(id))
    )
  );

  if (uniqueBeerIds.length === 0) {
    return [];
  }

  // Fetch full beer details with embeddings
  const { data: candidates, error } = await supabase
    .from('beers')
    .select(
      `
      beer_id,
      name,
      style,
      abv,
      description,
      brewery_id,
      brewery:breweries!beers_brewery_id_fkey (
        name,
        city,
        country
      ),
      beer_embeddings (
        embedding
      )
    `
    )
    .in('beer_id', uniqueBeerIds);

  if (error) {
    console.error('Error fetching candidate beers:', error);
    return [];
  }

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Transform the data
  const candidateBeers: CandidateBeer[] = candidates
    .filter((c) => {
      const embeddingObj = Array.isArray(c.beer_embeddings)
        ? c.beer_embeddings[0]
        : c.beer_embeddings;

      if (!embeddingObj || !embeddingObj.embedding) return false;

      // Parse pgvector string to array if needed
      let embedding = embeddingObj.embedding;
      if (typeof embedding === 'string') {
        try {
          embedding = JSON.parse(embedding);
        } catch (e) {
          console.warn(`Failed to parse embedding for beer ${c.beer_id}:`, e);
          return false;
        }
      }

      return Array.isArray(embedding) && embedding.length === 103;
    })
    .map((c) => {
      const embeddingObj = Array.isArray(c.beer_embeddings)
        ? c.beer_embeddings[0]
        : c.beer_embeddings;
      const brewery = Array.isArray(c.brewery) ? c.brewery[0] : c.brewery;

      // Parse embedding if it's a string
      let embedding = embeddingObj.embedding;
      if (typeof embedding === 'string') {
        embedding = JSON.parse(embedding);
      }

      return {
        beer_id: c.beer_id,
        embedding: embedding,
        name: c.name,
        style: c.style,
        abv: c.abv,
        brewery_id: c.brewery_id,
        brewery_name: brewery?.name,
        brewery_city: brewery?.city,
        brewery_country: brewery?.country,
        description: c.description,
      };
    });

  return candidateBeers;
}

/**
 * Fetch specific beers by IDs with full details
 * @param beerIds - Array of beer IDs to fetch
 * @returns Array of beer details
 */
export async function getBeersByIds(beerIds: number[]) {
  if (beerIds.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const { data: beers, error } = await supabase
    .from('beers')
    .select(
      `
      beer_id,
      name,
      style,
      super_style,
      abv,
      description,
      active,
      bias_term,
      scraped_review_count,
      user_review_count,
      brewery_id,
      brewery:breweries (
        brewery_id,
        name,
        city,
        country,
        province_or_state
      )
    `
    )
    .in('beer_id', beerIds);

  if (error) {
    console.error('Error fetching beers by IDs:', error);
    return [];
  }

  return beers || [];
}
