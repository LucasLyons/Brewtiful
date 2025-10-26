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
