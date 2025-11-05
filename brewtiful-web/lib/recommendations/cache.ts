/**
 * Caching utilities for k-means recommendations
 * Uses localStorage to cache recommendations with smart invalidation
 */

import type { CandidateBeer } from '@/lib/recommendations/user-kmeans';

/**
 * Lightweight version of CandidateBeer for caching
 * Excludes embedding vector to reduce size and prevent quota errors
 */
export interface CachedCandidateBeer {
  beer_id: number;
  similarity: number;
  cluster_index: number;
  bias_term: number;
  scraped_review_count: number;
  name: string;
  style: string;
  abv: number | null;
  brewery_id: number | null;
  brewery_name?: string;
  brewery_city?: string;
  brewery_country?: string;
  description?: string;
}

interface CachedRecommendations {
  candidatesByK: Record<string, CachedCandidateBeer[]>;
  timestamp: number;
  ratingHash: string;
  userId: string | null;
  kRange: number[];
  beersPerCentroid: number;
}

const CACHE_KEY_PREFIX = 'brewtiful_kmeans_cache_';
const CACHE_VERSION = 'v2'; // Bumped version to invalidate old caches with embeddings
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a hash from user's rated beer IDs
 * Used to detect when ratings change and invalidate cache
 */
export function generateRatingHash(ratedBeerIds: number[]): string {
  // Sort IDs to ensure consistent hashing regardless of order
  const sortedIds = [...ratedBeerIds].sort((a, b) => a - b);

  // Simple hash function - combine beer IDs into string
  // For better performance, we could use a proper hash function
  return sortedIds.join(',');
}

/**
 * Generate cache key for a specific user and rating set
 */
function getCacheKey(userId: string | null, ratingHash: string): string {
  const userKey = userId || 'anonymous';
  return `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${userKey}_${ratingHash}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedData: CachedRecommendations): boolean {
  const now = Date.now();
  const age = now - cachedData.timestamp;

  return age < CACHE_EXPIRY_MS;
}

/**
 * Convert CandidateBeer to CachedCandidateBeer by removing embedding
 * This significantly reduces cache size
 */
function stripEmbedding(candidate: CandidateBeer): CachedCandidateBeer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { embedding, ...rest } = candidate;
  return rest;
}

/**
 * Save recommendations to localStorage cache
 * Strips embeddings to reduce size and prevent quota errors
 */
export function saveCandidatesToCache(
  userId: string | null,
  ratedBeerIds: number[],
  candidatesByK: Record<string, CandidateBeer[]>,
  kRange: number[],
  beersPerCentroid: number
): void {
  try {
    const ratingHash = generateRatingHash(ratedBeerIds);
    const cacheKey = getCacheKey(userId, ratingHash);

    // Strip embeddings to reduce cache size (from ~500KB to ~50KB)
    const lightweightCandidates: Record<string, CachedCandidateBeer[]> = {};
    for (const [k, candidates] of Object.entries(candidatesByK)) {
      lightweightCandidates[k] = candidates.map(stripEmbedding);
    }

    const cacheData: CachedRecommendations = {
      candidatesByK: lightweightCandidates,
      timestamp: Date.now(),
      ratingHash,
      userId,
      kRange,
      beersPerCentroid
    };

    const serialized = JSON.stringify(cacheData);

    // Check size before saving (localStorage limit is typically 5-10MB per domain)
    const sizeInBytes = new Blob([serialized]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 4) {
      console.warn(`⚠️  Cache data too large (${sizeInMB.toFixed(2)}MB), skipping cache save`);
      return;
    }

    localStorage.setItem(cacheKey, serialized);
    console.log(`💾 Saved ${sizeInMB.toFixed(2)}MB to cache (${Object.keys(lightweightCandidates).length} k values)`);

    // Clean up old cache entries (keep only most recent 3)
    cleanupOldCaches(userId);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('⚠️  localStorage quota exceeded, clearing old caches...');
      // Try to free up space
      cleanupOldCaches(userId, 1);
      // Don't retry to avoid infinite loop
    } else {
      console.warn('Failed to save recommendations to cache:', error);
    }
    // Cache failure shouldn't break the app
  }
}

/**
 * Load recommendations from localStorage cache
 * Returns null if cache miss or invalid
 * Note: Cached data does NOT include embeddings (stripped to save space)
 */
export function loadCandidatesFromCache(
  userId: string | null,
  ratedBeerIds: number[],
  kRange: number[],
  beersPerCentroid: number
): Record<string, CachedCandidateBeer[]> | null {
  try {
    const ratingHash = generateRatingHash(ratedBeerIds);
    const cacheKey = getCacheKey(userId, ratingHash);

    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      return null;
    }

    const cachedData: CachedRecommendations = JSON.parse(cached);

    // Validate cache
    if (!isCacheValid(cachedData)) {
      // Expired - remove it
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Check if cache parameters match
    if (
      cachedData.beersPerCentroid !== beersPerCentroid ||
      !arraysEqual(cachedData.kRange, kRange)
    ) {
      // Parameters don't match - cache miss
      return null;
    }

    // Verify all required k values are present
    const hasAllK = kRange.every(k => `k${k}` in cachedData.candidatesByK);
    if (!hasAllK) {
      return null;
    }

    console.log('✅ Cache hit - loaded recommendations from localStorage');
    return cachedData.candidatesByK;
  } catch (error) {
    console.warn('Failed to load recommendations from cache:', error);
    return null;
  }
}

/**
 * Invalidate cache for a specific user
 * Call this when user rates/unrates a beer
 */
export function invalidateCache(userId: string | null): void {
  try {
    const userKey = userId || 'anonymous';
    const pattern = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${userKey}_`;

    // Find and remove all cache entries for this user
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pattern)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log(`🗑️  Invalidated ${keysToRemove.length} cache entries for user`);
    }
  } catch (error) {
    console.warn('Failed to invalidate cache:', error);
  }
}

/**
 * Clean up old cache entries to prevent localStorage bloat
 * Keeps only the most recent N entries per user
 */
function cleanupOldCaches(userId: string | null, keepCount: number = 3): void {
  try {
    const userKey = userId || 'anonymous';
    const pattern = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${userKey}_`;

    // Find all cache entries for this user
    const entries: { key: string; timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pattern)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          entries.push({ key, timestamp: data.timestamp || 0 });
        } catch {
          // Invalid entry - remove it
          localStorage.removeItem(key);
        }
      }
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp - a.timestamp);

    // Remove old entries
    entries.slice(keepCount).forEach(entry => {
      localStorage.removeItem(entry.key);
    });
  } catch (error) {
    console.warn('Failed to cleanup old caches:', error);
  }
}

/**
 * Helper function to compare two arrays for equality
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  entries: Array<{ userId: string; age: number; size: number }>;
} {
  const entries: Array<{ userId: string; age: number; size: number }> = [];
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        totalSize += size;

        try {
          const data = JSON.parse(value);
          const age = Date.now() - data.timestamp;
          entries.push({
            userId: data.userId || 'anonymous',
            age: Math.floor(age / 1000 / 60), // age in minutes
            size
          });
        } catch {
          // Invalid entry
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
  }

  return {
    totalEntries: entries.length,
    totalSize,
    entries
  };
}
