'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all user ratings in bulk (server-side).
 *
 * This function is designed to be called once per page to avoid N+1 queries.
 * Returns a Map of beer_id -> rating for O(1) lookup performance.
 *
 * Only works for authenticated users. Returns empty Map for unauthenticated users.
 *
 * @returns Promise resolving to a Map of beer IDs to rating values
 */
export async function getUserRatingsBulk(): Promise<Map<number, number>> {
  const supabase = await createClient()

  // Get current user from session
  const { data: { user } } = await supabase.auth.getUser()

  // Only authenticated users can have ratings
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
