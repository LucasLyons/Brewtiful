'use server'

import { createClient } from '@/utils/supabase/server'

export interface TrackBeerViewParams {
  beerId: number
  breweryId: number
  userId: string
}

export interface TrackBreweryViewParams {
  breweryId: number
  userId: string
}

/**
 * Tracks a beer view event for authenticated users.
 *
 * This function logs when an authenticated user views a beer detail page.
 *
 * @param params - View tracking parameters
 * @param params.beerId - The beer being viewed
 * @param params.breweryId - The brewery that makes the beer
 * @param params.userId - User UUID (required - must be authenticated)
 *
 * @returns Promise resolving when event is logged
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   await trackBeerView({
 *     beerId: 123,
 *     breweryId: 456,
 *     userId: user.id
 *   })
 * }
 * ```
 */
export async function trackBeerView({
  beerId,
  breweryId,
  userId
}: TrackBeerViewParams): Promise<void> {
  const supabase = await createClient()

  // Log the view event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'view',
      user_id: userId,
      beer_id: beerId,
      brewery_id: breweryId,
      metadata: {
        timestamp: new Date().toISOString(),
        entity_type: 'beer'
      }
    })

  if (eventError) {
    console.error('Error logging beer view event:', eventError)
    // Don't throw - event logging should not break page load
  }
}

/**
 * Tracks a brewery view event for authenticated users.
 *
 * This function logs when an authenticated user views a brewery detail page.
 *
 * @param params - View tracking parameters
 * @param params.breweryId - The brewery being viewed
 * @param params.userId - User UUID (required - must be authenticated)
 *
 * @returns Promise resolving when event is logged
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   await trackBreweryView({
 *     breweryId: 456,
 *     userId: user.id
 *   })
 * }
 * ```
 */
export async function trackBreweryView({
  breweryId,
  userId
}: TrackBreweryViewParams): Promise<void> {
  const supabase = await createClient()

  // Log the view event (beer_id is null for brewery-only views)
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'view',
      user_id: userId,
      beer_id: null,
      brewery_id: breweryId,
      metadata: {
        timestamp: new Date().toISOString(),
        entity_type: 'brewery'
      }
    })

  if (eventError) {
    console.error('Error logging brewery view event:', eventError)
    // Don't throw - event logging should not break page load
  }
}
