/**
 * User embeddings utilities for personalized beer recommendations
 *
 * This module handles incremental updates to user preference embeddings
 * based on beer ratings. The embedding update logic is:
 *
 * On rate: user_embedding += weight * beer_embedding
 * On unrate: user_embedding -= weight * beer_embedding
 *
 * Where weight is determined by the rating value:
 * - rating < 2: weight = 0.025
 * - 2 <= rating < 3: weight = 0.075
 * - 3 <= rating < 4: weight = 0.09
 * - rating >= 4: weight = 0.9
 */

export { getRatingWeight } from './rating-weights'

export {
  addVectors,
  subtractVectors,
  scaleVector,
  addWeightedVector,
  subtractWeightedVector,
  createZeroVector,
  toSqlVector,
  fromSqlVector
} from './vector-math'

export {
  updateUserEmbeddingOnRate,
  updateUserEmbeddingOnUnrate
} from './user-embedding-update'
