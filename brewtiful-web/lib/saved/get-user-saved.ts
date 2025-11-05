'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Checks if a beer is saved by the user.
 *
 * @param beerId - The beer ID to check
 * @param breweryId - The brewery ID
 * @param userId - User UUID (null for anonymous users)
 *
 * @returns Promise resolving to true if beer is saved, false otherwise
 */
export async function isBeerSaved(
  beerId: number,
  breweryId: number,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false // Anonymous users can't save beers

  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_saved_beers')
    .select('beer_id')
    .eq('user_id', userId)
    .eq('beer_id', beerId)
    .eq('brewery_id', breweryId)
    .maybeSingle()

  if (error) {
    console.error('Error checking if beer is saved:', error)
    return false
  }

  return data !== null
}

/**
 * Batch checks if multiple beers are saved by the user.
 * Much more efficient than calling isBeerSaved() multiple times (avoids N+1 query problem).
 *
 * @param beerIds - Array of beer IDs to check
 * @param userId - User UUID (null for anonymous users)
 *
 * @returns Promise resolving to a Map of beerId -> isSaved boolean
 */
export async function areBeersSaved(
  beerIds: number[],
  userId: string | null
): Promise<Map<number, boolean>> {
  const resultMap = new Map<number, boolean>()

  // Initialize all as false
  beerIds.forEach(id => resultMap.set(id, false))

  if (!userId || beerIds.length === 0) return resultMap

  const supabase = createClient()

  // Single query to fetch all saved beers for this user
  const { data, error } = await supabase
    .from('user_saved_beers')
    .select('beer_id')
    .eq('user_id', userId)
    .in('beer_id', beerIds)

  if (error) {
    console.error('Error batch checking saved beers:', error)
    return resultMap
  }

  // Mark saved beers as true
  if (data) {
    data.forEach(row => {
      resultMap.set(row.beer_id, true)
    })
  }

  return resultMap
}

/**
 * Checks if a brewery is saved by the user.
 *
 * @param breweryId - The brewery ID to check
 * @param userId - User UUID (null for anonymous users)
 *
 * @returns Promise resolving to true if brewery is saved, false otherwise
 */
export async function isBrewerySaved(
  breweryId: number,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false // Anonymous users can't save breweries

  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_saved_breweries')
    .select('brewery_id')
    .eq('user_id', userId)
    .eq('brewery_id', breweryId)
    .maybeSingle()

  if (error) {
    console.error('Error checking if brewery is saved:', error)
    return false
  }

  return data !== null
}
