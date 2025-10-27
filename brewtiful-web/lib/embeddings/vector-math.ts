/**
 * Vector math utilities for user embeddings
 * Uses pgvector npm package for proper vector handling
 */

import pgvector from 'pgvector/utils'

/**
 * Ensures input is a proper JavaScript array
 * Supabase pgvector embeddings may be returned as strings or special objects
 */
function ensureArray(vec: any): number[] {
  if (Array.isArray(vec)) {
    return vec;
  }
  // If it's a pgvector string format like "[1,2,3]"
  if (typeof vec === 'string') {
    // pgvector.fromSql handles the parsing
    try {
      return pgvector.fromSql(vec);
    } catch {
      // Fallback to JSON parse
      return JSON.parse(vec);
    }
  }
  // If it's an array-like object, convert to array
  if (vec && typeof vec === 'object' && 'length' in vec) {
    return Array.from(vec);
  }
  throw new Error(`Cannot convert to array: ${typeof vec}`);
}

/**
 * Add two vectors element-wise
 * @param vec1 - First vector
 * @param vec2 - Second vector
 * @returns The sum of the two vectors
 */
export function addVectors(vec1: any, vec2: any): number[] {
  const v1 = ensureArray(vec1);
  const v2 = ensureArray(vec2);

  if (v1.length !== v2.length) {
    throw new Error(
      `Vector dimensions must match: ${v1.length} !== ${v2.length}`
    );
  }
  return v1.map((val, idx) => val + v2[idx]);
}

/**
 * Subtract vec2 from vec1 element-wise
 * @param vec1 - First vector (minuend)
 * @param vec2 - Second vector (subtrahend)
 * @returns vec1 - vec2
 */
export function subtractVectors(vec1: any, vec2: any): number[] {
  const v1 = ensureArray(vec1);
  const v2 = ensureArray(vec2);

  if (v1.length !== v2.length) {
    throw new Error(
      `Vector dimensions must match: ${v1.length} !== ${v2.length}`
    );
  }
  return v1.map((val, idx) => val - v2[idx]);
}

/**
 * Multiply a vector by a scalar
 * @param vec - The vector to scale
 * @param scalar - The scalar multiplier
 * @returns The scaled vector
 */
export function scaleVector(vec: any, scalar: number): number[] {
  const v = ensureArray(vec);
  return v.map((val) => val * scalar);
}

/**
 * Add a weighted vector to another vector
 * @param baseVec - The base vector to add to
 * @param addVec - The vector to add
 * @param weight - The weight to apply to addVec
 * @returns baseVec + (weight * addVec)
 */
export function addWeightedVector(
  baseVec: any,
  addVec: any,
  weight: number
): number[] {
  const weighted = scaleVector(addVec, weight);
  return addVectors(baseVec, weighted);
}

/**
 * Subtract a weighted vector from another vector
 * @param baseVec - The base vector to subtract from
 * @param subVec - The vector to subtract
 * @param weight - The weight to apply to subVec
 * @returns baseVec - (weight * subVec)
 */
export function subtractWeightedVector(
  baseVec: any,
  subVec: any,
  weight: number
): number[] {
  const weighted = scaleVector(subVec, weight);
  return subtractVectors(baseVec, weighted);
}

/**
 * Create a zero vector of specified dimension
 * @param dimension - The dimension of the vector
 * @returns A zero vector
 */
export function createZeroVector(dimension: number): number[] {
  return new Array(dimension).fill(0);
}

/**
 * Convert a JavaScript array to pgvector SQL format
 * @param vec - The vector array
 * @returns SQL-formatted vector string
 */
export function toSqlVector(vec: number[]): string {
  return pgvector.toSql(vec);
}

/**
 * Convert pgvector SQL format to JavaScript array
 * @param vec - The SQL vector string or any vector format
 * @returns JavaScript array
 */
export function fromSqlVector(vec: any): number[] {
  return ensureArray(vec);
}
