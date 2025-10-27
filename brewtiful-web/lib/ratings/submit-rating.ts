'use client'

import { createClient } from '@/lib/supabase/client'
import {
  updateUserEmbeddingOnRate,
  updateUserEmbeddingOnUnrate
} from '@/lib/embeddings/user-embedding-update'

export interface SubmitRatingParams {
  beerId: number
  breweryId: number
  rating: number
  userId: string
}

/**
 * Submits a beer rating to both the user_ratings and events tables.
 *
 * This function only works for authenticated users.
 *
 * @param params - Rating submission parameters
 * @param params.beerId - The beer being rated
 * @param params.breweryId - The brewery that makes the beer
 * @param params.rating - Rating value (0.5 to 5.0 in 0.5 increments)
 * @param params.userId - User UUID (required - must be authenticated)
 *
 * @returns Promise resolving to the rating data
 * @throws Error if rating submission fails
 *
 * @example
 * ```tsx
 * const { data: { user } } = await supabase.auth.getUser()
 *
 * if (user) {
 *   await submitRating({
 *     beerId: 123,
 *     breweryId: 456,
 *     rating: 4.5,
 *     userId: user.id
 *   })
 * }
 * ```
 */
export async function submitRating({
  beerId,
  breweryId,
  rating,
  userId
}: SubmitRatingParams) {
  const supabase = createClient()

  // Validate rating is in valid range
  if (rating < 0.5 || rating > 5 || rating % 0.5 !== 0) {
    throw new Error('Rating must be between 0.5 and 5.0 in 0.5 increments')
  }

  // Insert or update rating in user_ratings table
  // Using upsert to handle both new ratings and updates
  // Primary key is (user_id, beer_id, brewery_id)
  const { data: ratingData, error: ratingError } = await supabase
    .from('user_ratings')
    .upsert(
      {
        user_id: userId,
        beer_id: beerId,
        brewery_id: breweryId,
        rating
      },
      {
        onConflict: 'user_id,beer_id,brewery_id'
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
      metadata: {
        rating,
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging rating event:', eventError)
    // Don't throw - rating was saved, event logging is secondary
  }

  // Update user embedding based on the rating
  try {
    await updateUserEmbeddingOnRate(userId, beerId, rating)
  } catch (embeddingError) {
    console.error('Error updating user embedding:', embeddingError)
    // Don't throw - rating was saved, embedding update is secondary
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
  userId
}: Omit<SubmitRatingParams, 'rating'>) {
  const supabase = createClient()

  // Update user embedding BEFORE deleting the rating
  // (we need the rating value to calculate the weight)
  try {
    await updateUserEmbeddingOnUnrate(userId, beerId)
  } catch (embeddingError) {
    console.error('Error updating user embedding on unrate:', embeddingError)
    // Don't throw - we still want to delete the rating
  }

  // Delete rating for authenticated user
  const { error: deleteError } = await supabase
    .from('user_ratings')
    .delete()
    .eq('beer_id', beerId)
    .eq('brewery_id', breweryId)
    .eq('user_id', userId)

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
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  if (eventError) {
    console.error('Error logging unrate event:', eventError)
    // Don't throw - rating was removed, event logging is secondary
  }
}
