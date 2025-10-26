'use client'

import { createClient } from '@/lib/supabase/client'

export interface UserRating {
  user_id: string | null
  beer_id: number
  brewery_id: number
  rating: number
  client_id: string
}

/**
 * Fetches the current user's rating for a specific beer.
 *
 * This function handles both authenticated and anonymous users:
 * - Authenticated users: Filters by user_id
 * - Anonymous users: Filters by client_id AND user_id IS NULL
 *
 * IMPORTANT: For anonymous users, ALWAYS filter by client_id to ensure
 * data isolation (RLS policy allows access to all NULL user_id rows)
 *
 * @param beerId - The beer ID to get the rating for
 * @param breweryId - The brewery ID
 * @param userId - User UUID (null for anonymous users)
 * @param clientId - Client ID from localStorage (required for anonymous users)
 *
 * @returns Promise resolving to the rating value, or null if no rating exists
 *
 * @example
 * ```tsx
 * const clientId = useClientId()
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * const rating = await getUserRating(
 *   123,
 *   456,
 *   user?.id || null,
 *   clientId
 * )
 * ```
 */
export async function getUserRating(
  beerId: number,
  breweryId: number,
  userId: string | null,
  clientId: string
): Promise<number | null> {
  const supabase = createClient()

  // Build query based on authentication state
  let query = supabase
    .from('user_ratings')
    .select('rating')
    .eq('beer_id', beerId)
    .eq('brewery_id', breweryId)

  if (userId) {
    // Authenticated user - filter by user_id
    query = query.eq('user_id', userId)
  } else {
    // Anonymous user - MUST filter by client_id AND user_id IS NULL
    // This is critical for data isolation since RLS allows access to all NULL user_id rows
    query = query.is('user_id', null).eq('client_id', clientId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error fetching user rating:', error)
    return null
  }

  return data?.rating ?? null
}

/**
 * Fetches all ratings for the current user.
 *
 * Useful for displaying a user's rating history or pre-loading ratings
 * for a list of beers.
 *
 * @param userId - User UUID (null for anonymous users)
 * @param clientId - Client ID from localStorage (required for anonymous users)
 *
 * @returns Promise resolving to an array of UserRating objects
 *
 * @example
 * ```tsx
 * const ratings = await getAllUserRatings(user?.id || null, clientId)
 * const ratingsByBeerId = new Map(ratings.map(r => [r.beer_id, r.rating]))
 * ```
 */
export async function getAllUserRatings(
  userId: string | null,
  clientId: string
): Promise<UserRating[]> {
  const supabase = createClient()

  // Build query based on authentication state
  let query = supabase.from('user_ratings').select('*')

  if (userId) {
    // Authenticated user - filter by user_id
    query = query.eq('user_id', userId)
  } else {
    // Anonymous user - MUST filter by client_id AND user_id IS NULL
    query = query.is('user_id', null).eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching user ratings:', error)
    return []
  }

  return data ?? []
}

/**
 * Fetches ratings for multiple beers at once.
 *
 * More efficient than calling getUserRating multiple times.
 * Returns a Map for O(1) lookup by beer_id.
 *
 * @param beerIds - Array of beer IDs to fetch ratings for
 * @param userId - User UUID (null for anonymous users)
 * @param clientId - Client ID from localStorage
 *
 * @returns Promise resolving to a Map of beer_id -> rating
 *
 * @example
 * ```tsx
 * const beerIds = [123, 456, 789]
 * const ratings = await getBatchUserRatings(beerIds, user?.id || null, clientId)
 *
 * // Look up rating for beer 123
 * const rating = ratings.get(123) // number | undefined
 * ```
 */
export async function getBatchUserRatings(
  beerIds: number[],
  userId: string | null,
  clientId: string
): Promise<Map<number, number>> {
  if (beerIds.length === 0) {
    return new Map()
  }

  const supabase = createClient()

  // Build query based on authentication state
  let query = supabase
    .from('user_ratings')
    .select('beer_id, rating')
    .in('beer_id', beerIds)

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.is('user_id', null).eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching batch user ratings:', error)
    return new Map()
  }

  // Convert to Map for efficient lookup
  return new Map((data ?? []).map(({ beer_id, rating }) => [beer_id, rating]))
}
