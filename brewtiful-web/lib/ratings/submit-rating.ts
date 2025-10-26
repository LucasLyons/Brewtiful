'use client'

import { createClient } from '@/lib/supabase/client'

export interface SubmitRatingParams {
  beerId: number
  breweryId: number
  rating: number
  userId: string | null
  clientId: string
}

/**
 * Submits a beer rating to both the user_ratings and events tables.
 *
 * This function handles both authenticated and anonymous users:
 * - Authenticated users: userId is set, clientId is tracked for migration
 * - Anonymous users: userId is null, clientId is used for filtering
 *
 * @param params - Rating submission parameters
 * @param params.beerId - The beer being rated
 * @param params.breweryId - The brewery that makes the beer
 * @param params.rating - Rating value (0.5 to 5.0 in 0.5 increments)
 * @param params.userId - User UUID (null for anonymous users)
 * @param params.clientId - Client ID from localStorage (required for all users)
 *
 * @returns Promise resolving to the rating data
 * @throws Error if rating submission fails
 *
 * @example
 * ```tsx
 * const clientId = useClientId()
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * await submitRating({
 *   beerId: 123,
 *   breweryId: 456,
 *   rating: 4.5,
 *   userId: user?.id || null,
 *   clientId
 * })
 * ```
 */
export async function submitRating({
  beerId,
  breweryId,
  rating,
  userId,
  clientId
}: SubmitRatingParams) {
  const supabase = createClient()

  // Validate rating is in valid range
  if (rating < 0.5 || rating > 5 || rating % 0.5 !== 0) {
    throw new Error('Rating must be between 0.5 and 5.0 in 0.5 increments')
  }

  // Insert or update rating in user_ratings table
  // Using upsert to handle both new ratings and updates
  // Primary key is (beer_id, brewery_id, client_id) - user_id can be NULL
  const { data: ratingData, error: ratingError } = await supabase
    .from('user_ratings')
    .upsert(
      {
        user_id: userId,
        beer_id: beerId,
        brewery_id: breweryId,
        rating,
        client_id: clientId
      },
      {
        onConflict: 'beer_id,brewery_id,client_id'
      }
    )
    .select()
    .single()

  if (ratingError) {
    console.error('Error submitting rating:', ratingError)
    throw new Error(`Failed to submit rating: ${ratingError.message}`)
  }

  // Log the rating event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'rate',
      user_id: userId,
      beer_id: beerId,
      brewery_id: breweryId,
      client_id: clientId,
      metadata: {
        rating,
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging rating event:', eventError)
    // Don't throw - rating was saved, event logging is secondary
  }

  return ratingData
}

/**
 * Removes a beer rating and logs an unrate event.
 *
 * @param params - Parameters for removing a rating
 * @returns Promise resolving when rating is removed
 * @throws Error if rating removal fails
 */
export async function removeRating({
  beerId,
  breweryId,
  userId,
  clientId
}: Omit<SubmitRatingParams, 'rating'>) {
  const supabase = createClient()

  // Build delete query based on user authentication state
  let query = supabase
    .from('user_ratings')
    .delete()
    .eq('beer_id', beerId)
    .eq('brewery_id', breweryId)

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.is('user_id', null).eq('client_id', clientId)
  }

  const { error: deleteError } = await query

  if (deleteError) {
    console.error('Error removing rating:', deleteError)
    throw new Error(`Failed to remove rating: ${deleteError.message}`)
  }

  // Log the unrate event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_type: 'unrate',
      user_id: userId,
      beer_id: beerId,
      brewery_id: breweryId,
      client_id: clientId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging unrate event:', eventError)
    // Don't throw - rating was removed, event logging is secondary
  }
}
