import { createClient } from '@/utils/supabase/server';

/**
 * Get personalized beer recommendations for a user based on their embedding
 *
 * @param userId - The user UUID to get recommendations for
 * @param showInactive - Whether to include inactive beers (default: false)
 * @returns Array of recommended beer objects with brewery info and similarity scores
 */
export async function getUserRecommendations(
  userId: string,
  showInactive: boolean = false
) {
  const supabase = await createClient();

  // Get recommended beer IDs with similarity scores from the RPC function
  const { data: recommendations, error: rpcError } = await supabase.rpc('get_user_recs_placeholder', {
    user_id_input: userId,
    show_inactive: showInactive
  });

  if (rpcError) {
    console.error('RPC Error details:', JSON.stringify(rpcError, null, 2));
    return [];
  }

  if (!recommendations || recommendations.length === 0) {
    console.log('No recommendations found for user:', userId);
    return [];
  }

  // Extract beer IDs
  const beerIds = recommendations.map((row: { beer_id: number }) => row.beer_id);

  // Fetch full beer details with brewery information
  const { data: beers, error: beersError } = await supabase
    .from('beers')
    .select(`
      *,
      brewery:breweries!beers_brewery_id_fkey (
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
    recommendations.map((row: { beer_id: number; similarity: number }) => [
      row.beer_id,
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
