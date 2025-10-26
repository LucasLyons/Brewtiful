'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all saved beer IDs for the current user (server-side).
 *
 * This function is designed to be called once per page to avoid N+1 queries.
 * Returns a Set of beer_ids for O(1) lookup performance.
 *
 * @returns Promise resolving to a Set of beer IDs that are saved
 */
export async function getSavedBeerIds(): Promise<Set<number>> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Set()
  }

  // Fetch all saved beers for this user
  const { data, error } = await supabase
    .from('user_saved_beers')
    .select('beer_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching saved beers:', error)
    return new Set()
  }

  // Convert to Set for O(1) lookup
  return new Set(data.map(row => row.beer_id))
}

/**
 * Fetches all saved brewery IDs for the current user (server-side).
 *
 * This function is designed to be called once per page to avoid N+1 queries.
 * Returns a Set of brewery_ids for O(1) lookup performance.
 *
 * @returns Promise resolving to a Set of brewery IDs that are saved
 */
export async function getSavedBreweryIds(): Promise<Set<number>> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Set()
  }

  // Fetch all saved breweries for this user
  const { data, error } = await supabase
    .from('user_saved_breweries')
    .select('brewery_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching saved breweries:', error)
    return new Set()
  }

  // Convert to Set for O(1) lookup
  return new Set(data.map(row => row.brewery_id))
}
