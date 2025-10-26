'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all user ratings in bulk (server-side).
 *
 * This function is designed to be called once per page to avoid N+1 queries.
 * Returns a Map of beer_id -> rating for O(1) lookup performance.
 *
 * Handles both authenticated and anonymous users:
 * - Authenticated users: Filters by user_id from session
 * - Anonymous users: Returns empty Map (no client_id available server-side)
 *
 * @returns Promise resolving to a Map of beer IDs to rating values
 */
export async function getUserRatingsBulk(): Promise<Map<number, number>> {
  const supabase = await createClient()

  // Get current user from session
  const { data: { user } } = await supabase.auth.getUser()

  // For anonymous users, we can't get ratings server-side (no client_id)
  // Ratings will be fetched client-side for anonymous users
  if (!user) {
    return new Map()
  }

  // Fetch all ratings for authenticated user
  const { data, error } = await supabase
    .from('user_ratings')
    .select('beer_id, rating')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching user ratings in bulk:', error)
    return new Map()
  }

  // Convert to Map for O(1) lookup
  return new Map((data ?? []).map(({ beer_id, rating }) => [beer_id, rating]))
}
