import { createClient } from '@/utils/supabase/server';

/**
 * Get similar beers based on embedding cosine similarity
 *
 * @param beerId - The beer ID to find similar beers for
 * @param limit - Maximum number of similar beers to return (default: 10)
 * @returns Array of similar beer IDs, ordered by similarity (most similar first)
 */
export async function getSimilarBeerIds(
  beerId: number,
  limit: number = 10,
  show: boolean = false
): Promise<number[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_similar_beers', {
    beer_id_input: beerId,
    match_count: limit,
    show_inactive: show ? 'TRUE' : 'FALSE'
  });

  if (error) {
    console.error('Error fetching similar beers:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Extract just the beer IDs from the result
  return data.map((row: { beer_id: number; similarity: number }) => row.beer_id);
}

/**
 * Get similar beers with full beer details and similarity scores
 *
 * @param beerId - The beer ID to find similar beers for
 * @param limit - Maximum number of similar beers to return (default: 10)
 * @returns Array of beer objects with brewery info and similarity scores
 */
export async function getSimilarBeers(
  beerId: number,
  limit: number = 10,
  show: boolean = false
) {
  const supabase = await createClient();

  // Get similar beer IDs with similarity scores
  const { data: similarBeers, error: rpcError } = await supabase.rpc('get_similar_beers', {
    beer_id_input: beerId,
    match_count: limit,
    show_inactive: show ? 'TRUE' : 'FALSE'
  });

  if (rpcError) {
    console.error('RPC Error details:', JSON.stringify(rpcError, null, 2));
    return [];
  }

  if (!similarBeers) {
    console.log('similarBeers is null/undefined');
    return [];
  }

  if (similarBeers.length === 0) {
    console.log('similarBeers array is empty');
    return [];
  }

  // Extract beer IDs
  const beerIds = similarBeers.map((row: { beer_id: number }) => row.beer_id);

  // Fetch full beer details with brewery information
  const { data: beers, error: beersError } = await supabase
    .from('beers')
    .select(`
      *,
      brewery:breweries (
        brewery_id,
        name,
        country,
        province_or_state,
        city
      )
    `)
    .in('beer_id', beerIds);

  if (beersError || !beers) {
    console.error('Error fetching beer details:', beersError);
    return [];
  }

  // Create a map of similarity scores for quick lookup
  const similarityMap = new Map(
    similarBeers.map((row: { id: number; similarity: number }) => [
      row.id,
      row.similarity,
    ])
  );

  // Attach similarity scores to beer objects and sort by similarity
  const beersWithSimilarity = beers
    .map((beer) => ({
      ...beer,
      similarity: similarityMap.get(beer.beer_id) || 0,
    }))
    .sort((a, b) => a.similarity - b.similarity); // Lower distance = more similar

  return beersWithSimilarity;
}
