'use client'

import { createClient } from '@/lib/supabase/client'

export interface SaveBreweryParams {
  breweryId: number
  userId: string
  clientId: string
}

/**
 * Saves a brewery to the user's saved list and logs a save event.
 *
 * This function only works for authenticated users.
 *
 * @param params - Save brewery parameters
 * @param params.breweryId - The brewery being saved
 * @param params.userId - User UUID (required for authenticated users)
 * @param params.clientId - Client ID from localStorage (required for event tracking)
 *
 * @returns Promise resolving to the saved brewery data
 * @throws Error if save operation fails
 *
 * @example
 * ```tsx
 * const clientId = useClientId()
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   await saveBrewery({
 *     breweryId: 456,
 *     userId: user.id,
 *     clientId
 *   })
 * }
 * ```
 */
export async function saveBrewery({
  breweryId,
  userId,
  clientId
}: SaveBreweryParams) {
  const supabase = createClient()

  // Insert into user_saved_breweries table
  const { data: savedData, error: savedError } = await supabase
    .from('user_saved_breweries')
    .insert({
      user_id: userId,
      brewery_id: breweryId
    })
    .select()
    .single()

  if (savedError) {
    console.error('Error saving brewery:', savedError)
    throw new Error(`Failed to save brewery: ${savedError.message}`)
  }

  // Log the save event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'save',
      user_id: userId,
      brewery_id: breweryId,
      beer_id: null,
      client_id: clientId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging save event:', eventError)
    // Don't throw - brewery was saved, event logging is secondary
  }

  return savedData
}

/**
 * Removes a brewery from the user's saved list and logs an unsave event.
 *
 * @param params - Parameters for removing a saved brewery
 * @returns Promise resolving when brewery is unsaved
 * @throws Error if unsave operation fails
 */
export async function unsaveBrewery({
  breweryId,
  userId,
  clientId
}: SaveBreweryParams) {
  const supabase = createClient()

  // Delete from user_saved_breweries table
  const { error: deleteError } = await supabase
    .from('user_saved_breweries')
    .delete()
    .eq('user_id', userId)
    .eq('brewery_id', breweryId)

  if (deleteError) {
    console.error('Error unsaving brewery:', deleteError)
    throw new Error(`Failed to unsave brewery: ${deleteError.message}`)
  }

  // Log the unsave event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'unsave',
      user_id: userId,
      brewery_id: breweryId,
      beer_id: null,
      client_id: clientId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging unsave event:', eventError)
    // Don't throw - brewery was unsaved, event logging is secondary
  }
}
