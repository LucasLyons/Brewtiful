'use client'

import { createClient } from '@/lib/supabase/client'

export interface SaveBeerParams {
  beerId: number
  breweryId: number
  userId: string
}

/**
 * Saves a beer to the user's saved list and logs a save event.
 *
 * This function only works for authenticated users.
 *
 * @param params - Save beer parameters
 * @param params.beerId - The beer being saved
 * @param params.breweryId - The brewery that makes the beer
 * @param params.userId - User UUID (required for authenticated users)
 *
 * @returns Promise resolving to the saved beer data
 * @throws Error if save operation fails
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   await saveBeer({
 *     beerId: 123,
 *     breweryId: 456,
 *     userId: user.id
 *   })
 * }
 * ```
 */
export async function saveBeer({
  beerId,
  breweryId,
  userId
}: SaveBeerParams) {
  const supabase = createClient()

  // Insert into user_saved_beers table
  const { data: savedData, error: savedError } = await supabase
    .from('user_saved_beers')
    .insert({
      user_id: userId,
      beer_id: beerId,
      brewery_id: breweryId
    })
    .select()
    .single()

  if (savedError) {
    console.error('Error saving beer:', savedError)
    throw new Error(`Failed to save beer: ${savedError.message}`)
  }

  // Log the save event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'save',
      user_id: userId,
      beer_id: beerId,
      brewery_id: breweryId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging save event:', eventError)
    // Don't throw - beer was saved, event logging is secondary
  }

  return savedData
}

/**
 * Removes a beer from the user's saved list and logs an unsave event.
 *
 * @param params - Parameters for removing a saved beer
 * @returns Promise resolving when beer is unsaved
 * @throws Error if unsave operation fails
 */
export async function unsaveBeer({
  beerId,
  breweryId,
  userId
}: SaveBeerParams) {
  const supabase = createClient()

  // Delete from user_saved_beers table
  const { error: deleteError } = await supabase
    .from('user_saved_beers')
    .delete()
    .eq('user_id', userId)
    .eq('beer_id', beerId)
    .eq('brewery_id', breweryId)

  if (deleteError) {
    console.error('Error unsaving beer:', deleteError)
    throw new Error(`Failed to unsave beer: ${deleteError.message}`)
  }

  // Log the unsave event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'unsave',
      user_id: userId,
      beer_id: beerId,
      brewery_id: breweryId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging unsave event:', eventError)
    // Don't throw - beer was unsaved, event logging is secondary
  }
}
