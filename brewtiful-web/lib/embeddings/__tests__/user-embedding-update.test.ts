/**
 * Tests for user embedding update logic
 *
 * NOTE: These are unit tests for the vector math logic.
 * Integration tests with the database should be run separately.
 */

import { getRatingWeight } from '../rating-weights'
import {
  addWeightedVector,
  subtractWeightedVector,
  createZeroVector,
  addVectors,
  subtractVectors,
  scaleVector
} from '../vector-math'

describe('getRatingWeight', () => {
  it('should return 0.025 for ratings below 2', () => {
    expect(getRatingWeight(0.5)).toBe(0.025)
    expect(getRatingWeight(1.0)).toBe(0.025)
    expect(getRatingWeight(1.5)).toBe(0.025)
  })

  it('should return 0.075 for ratings 2 to <3', () => {
    expect(getRatingWeight(2.0)).toBe(0.075)
    expect(getRatingWeight(2.5)).toBe(0.075)
  })

  it('should return 0.09 for ratings 3 to <4', () => {
    expect(getRatingWeight(3.0)).toBe(0.09)
    expect(getRatingWeight(3.5)).toBe(0.09)
  })

  it('should return 0.9 for ratings 4 and above', () => {
    expect(getRatingWeight(4.0)).toBe(0.9)
    expect(getRatingWeight(4.5)).toBe(0.9)
    expect(getRatingWeight(5.0)).toBe(0.9)
  })
})

describe('Vector Math', () => {
  describe('createZeroVector', () => {
    it('should create a zero vector of specified dimension', () => {
      const vec = createZeroVector(103)
      expect(vec.length).toBe(103)
      expect(vec.every((val) => val === 0)).toBe(true)
    })
  })

  describe('addVectors', () => {
    it('should add two vectors element-wise', () => {
      const vec1 = [1, 2, 3]
      const vec2 = [4, 5, 6]
      const result = addVectors(vec1, vec2)
      expect(result).toEqual([5, 7, 9])
    })

    it('should throw error for mismatched dimensions', () => {
      const vec1 = [1, 2, 3]
      const vec2 = [4, 5]
      expect(() => addVectors(vec1, vec2)).toThrow()
    })
  })

  describe('subtractVectors', () => {
    it('should subtract second vector from first', () => {
      const vec1 = [5, 7, 9]
      const vec2 = [1, 2, 3]
      const result = subtractVectors(vec1, vec2)
      expect(result).toEqual([4, 5, 6])
    })

    it('should throw error for mismatched dimensions', () => {
      const vec1 = [1, 2, 3]
      const vec2 = [4, 5]
      expect(() => subtractVectors(vec1, vec2)).toThrow()
    })
  })

  describe('scaleVector', () => {
    it('should multiply each element by scalar', () => {
      const vec = [1, 2, 3]
      const result = scaleVector(vec, 2)
      expect(result).toEqual([2, 4, 6])
    })

    it('should handle decimal scalars', () => {
      const vec = [10, 20, 30]
      const result = scaleVector(vec, 0.5)
      expect(result).toEqual([5, 10, 15])
    })
  })

  describe('addWeightedVector', () => {
    it('should add weighted vector to base vector', () => {
      const base = [10, 20, 30]
      const add = [1, 2, 3]
      const weight = 2
      const result = addWeightedVector(base, add, weight)
      expect(result).toEqual([12, 24, 36])
    })

    it('should work with rating weights', () => {
      const userEmbedding = [0, 0, 0]
      const beerEmbedding = [10, 20, 30]
      const rating = 4.5
      const weight = getRatingWeight(rating)
      const result = addWeightedVector(userEmbedding, beerEmbedding, weight)
      expect(result).toEqual([9, 18, 27]) // 0.9 * [10, 20, 30]
    })
  })

  describe('subtractWeightedVector', () => {
    it('should subtract weighted vector from base vector', () => {
      const base = [12, 24, 36]
      const sub = [1, 2, 3]
      const weight = 2
      const result = subtractWeightedVector(base, sub, weight)
      expect(result).toEqual([10, 20, 33])
    })

    it('should reverse the effect of addWeightedVector', () => {
      const initial = [10, 20, 30]
      const beer = [5, 10, 15]
      const rating = 3.5
      const weight = getRatingWeight(rating)

      // Add the beer embedding
      const afterRate = addWeightedVector(initial, beer, weight)

      // Remove the beer embedding
      const afterUnrate = subtractWeightedVector(afterRate, beer, weight)

      // Should return to initial state
      expect(afterUnrate).toEqual(initial)
    })
  })
})

describe('Integration: Rating Flow', () => {
  it('should correctly update user embedding through rate/unrate cycle', () => {
    const dimension = 103
    let userEmbedding = createZeroVector(dimension)

    // Mock beer embeddings (just use simple values for testing)
    const beer1 = new Array(dimension).fill(1)
    const beer2 = new Array(dimension).fill(2)
    const beer3 = new Array(dimension).fill(3)

    // User rates beer1 with 5.0 (weight 0.9)
    const rating1 = 5.0
    userEmbedding = addWeightedVector(userEmbedding, beer1, getRatingWeight(rating1))
    expect(userEmbedding[0]).toBe(0.9)

    // User rates beer2 with 3.5 (weight 0.09)
    const rating2 = 3.5
    userEmbedding = addWeightedVector(userEmbedding, beer2, getRatingWeight(rating2))
    expect(userEmbedding[0]).toBe(0.9 + 0.18) // 0.9 + (2 * 0.09)

    // User rates beer3 with 2.0 (weight 0.075)
    const rating3 = 2.0
    userEmbedding = addWeightedVector(userEmbedding, beer3, getRatingWeight(rating3))
    expect(userEmbedding[0]).toBeCloseTo(1.305, 5) // 0.9 + 0.18 + 0.225

    // User unrates beer2
    userEmbedding = subtractWeightedVector(userEmbedding, beer2, getRatingWeight(rating2))
    expect(userEmbedding[0]).toBeCloseTo(1.125, 5) // 1.305 - 0.18

    // Verify the embedding still has the contributions from beer1 and beer3
    const expectedAfterUnrate = 0.9 + 0.225
    expect(userEmbedding[0]).toBeCloseTo(expectedAfterUnrate, 5)
  })
})
