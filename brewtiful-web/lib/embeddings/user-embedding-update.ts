'use client'

import { createClient } from '@/lib/supabase/client'
import { getRatingWeight } from './rating-weights'
import {
  addWeightedVector,
  subtractWeightedVector,
  createZeroVector
} from './vector-math'

const EMBEDDING_DIMENSION = 103

/**
 * Updates a user's embedding when they rate a beer
 *
 * Algorithm:
 * 1. Fetch current user embedding (or create zero vector if none exists)
 * 2. Fetch the beer's item embedding
 * 3. Calculate weight based on rating value
 * 4. Add weighted beer embedding to user embedding
 * 5. Upsert the updated user embedding
 *
 * @param userId - The user's UUID
 * @param beerId - The beer being rated
 * @param rating - The rating value (0.5 to 5.0)
 * @returns Promise resolving when embedding is updated
 * @throws Error if update fails
 */
export async function updateUserEmbeddingOnRate(
  userId: string,
  beerId: number,
  rating: number
): Promise<void> {
  const supabase = createClient()

  // 1. Fetch current user embedding
  const { data: userEmbedding, error: userError } = await supabase
    .from('user_embeddings')
    .select('embedding')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    throw new Error(`Failed to fetch user embedding: ${userError.message}`)
  }

  // Start with zero vector if user has no embedding yet
  const currentEmbedding: number[] = userEmbedding?.embedding || createZeroVector(EMBEDDING_DIMENSION)

  // 2. Fetch the beer's item embedding
  const { data: beerEmbedding, error: beerError } = await supabase
    .from('beer_embeddings')
    .select('embedding')
    .eq('id', beerId)
    .single()

  if (beerError) {
    throw new Error(`Failed to fetch beer embedding: ${beerError.message}`)
  }

  if (!beerEmbedding?.embedding) {
    throw new Error(`No embedding found for beer ${beerId}`)
  }

  // 3. Calculate weight based on rating
  const weight = getRatingWeight(rating)

  // 4. Add weighted beer embedding to user embedding
  const updatedEmbedding = addWeightedVector(
    currentEmbedding,
    beerEmbedding.embedding,
    weight
  )

  // 5. Upsert the updated user embedding
  const { error: upsertError } = await supabase
    .from('user_embeddings')
    .upsert(
      {
        id: userId,
        embedding: updatedEmbedding
      },
      {
        onConflict: 'id'
      }
    )

  if (upsertError) {
    throw new Error(`Failed to update user embedding: ${upsertError.message}`)
  }
}

/**
 * Updates a user's embedding when they unrate a beer
 *
 * Algorithm:
 * 1. Count user's total ratings
 * 2. If count == 1 (last rating), delete the rating AND the user embedding
 * 3. If count > 1:
 *    a. Fetch the rating value for this specific beer
 *    b. Calculate weight based on rating value
 *    c. Fetch the beer's item embedding
 *    d. Subtract weighted beer embedding from user embedding
 *    e. Update the user embedding
 *
 * @param userId - The user's UUID
 * @param beerId - The beer being unrated
 * @returns Promise resolving when embedding is updated
 * @throws Error if update fails
 */
export async function updateUserEmbeddingOnUnrate(
  userId: string,
  beerId: number
): Promise<void> {
  const supabase = createClient()

  // 1. Count user's total ratings
  const { count, error: countError } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw new Error(`Failed to count user ratings: ${countError.message}`)
  }

  // 2. If this is the user's last rating, delete their embedding
  if (count === 1) {
    const { error: deleteError } = await supabase
      .from('user_embeddings')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user embedding:', deleteError)
      // Don't throw - this is cleanup, and the rating will be deleted separately
    }
    return
  }

  // 3. For users with multiple ratings, subtract this beer's contribution

  // 3a. Fetch the rating value for this specific beer
  const { data: ratingData, error: ratingError } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('beer_id', beerId)
    .single()

  if (ratingError) {
    throw new Error(
      `Failed to fetch rating for beer ${beerId}: ${ratingError.message}`
    )
  }

  if (!ratingData) {
    throw new Error(`No rating found for user ${userId} and beer ${beerId}`)
  }

  // 3b. Calculate weight based on rating value
  const weight = getRatingWeight(ratingData.rating)

  // 3c. Fetch the beer's item embedding
  const { data: beerEmbedding, error: beerError } = await supabase
    .from('beer_embeddings')
    .select('embedding')
    .eq('id', beerId)
    .single()

  if (beerError) {
    throw new Error(`Failed to fetch beer embedding: ${beerError.message}`)
  }

  if (!beerEmbedding?.embedding) {
    throw new Error(`No embedding found for beer ${beerId}`)
  }

  // Fetch current user embedding
  const { data: userEmbedding, error: userError } = await supabase
    .from('user_embeddings')
    .select('embedding')
    .eq('id', userId)
    .single()

  if (userError) {
    throw new Error(`Failed to fetch user embedding: ${userError.message}`)
  }

  if (!userEmbedding?.embedding) {
    throw new Error(`No embedding found for user ${userId}`)
  }

  // 3d. Subtract weighted beer embedding from user embedding
  const updatedEmbedding = subtractWeightedVector(
    userEmbedding.embedding,
    beerEmbedding.embedding,
    weight
  )

  // 3e. Update the user embedding
  const { error: updateError } = await supabase
    .from('user_embeddings')
    .update({ embedding: updatedEmbedding })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`Failed to update user embedding: ${updateError.message}`)
  }
}
