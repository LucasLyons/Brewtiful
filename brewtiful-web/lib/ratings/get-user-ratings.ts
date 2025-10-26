'use client'

import { createClient } from '@/lib/supabase/client'

export interface UserRating {
  user_id: string
  beer_id: number
  brewery_id: number
  rating: number
}

/**
 * Fetches the current user's rating for a specific beer.
 *
 * This function only works for authenticated users.
 *
 * @param beerId - The beer ID to get the rating for
 * @param breweryId - The brewery ID
 * @param userId - User UUID (required - must be authenticated)
 *
 * @returns Promise resolving to the rating value, or null if no rating exists
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   const rating = await getUserRating(123, 456, user.id)
 * }
 * ```
 */
export async function getUserRating(
  beerId: number,
  breweryId: number,
  userId: string
): Promise<number | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('beer_id', beerId)
    .eq('brewery_id', breweryId)
    .eq('user_id', userId)
    .maybeSingle()

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
 * @param userId - User UUID (required - must be authenticated)
 *
 * @returns Promise resolving to an array of UserRating objects
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   const ratings = await getAllUserRatings(user.id)
 *   const ratingsByBeerId = new Map(ratings.map(r => [r.beer_id, r.rating]))
 * }
 * ```
 */
export async function getAllUserRatings(
  userId: string
): Promise<UserRating[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_ratings')
    .select('*')
    .eq('user_id', userId)

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
 * @param userId - User UUID (required - must be authenticated)
 *
 * @returns Promise resolving to a Map of beer_id -> rating
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   const beerIds = [123, 456, 789]
 *   const ratings = await getBatchUserRatings(beerIds, user.id)
 *
 *   // Look up rating for beer 123
 *   const rating = ratings.get(123) // number | undefined
 * }
 * ```
 */
export async function getBatchUserRatings(
  beerIds: number[],
  userId: string
): Promise<Map<number, number>> {
  if (beerIds.length === 0) {
    return new Map()
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_ratings')
    .select('beer_id, rating')
    .in('beer_id', beerIds)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching batch user ratings:', error)
    return new Map()
  }

  // Convert to Map for efficient lookup
  return new Map((data ?? []).map(({ beer_id, rating }) => [beer_id, rating]))
}
