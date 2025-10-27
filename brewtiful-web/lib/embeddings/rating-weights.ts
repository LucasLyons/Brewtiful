/**
 * Calculate the weight for a given rating based on binned values
 *
 * Rating bins and weights:
 * - rating < 2: weight = 0.025
 * - 2 <= rating < 3: weight = 0.075
 * - 3 <= rating < 4: weight = 0.09
 * - rating >= 4: weight = 0.9
 *
 * @param rating - The beer rating (typically 1-5)
 * @returns The weight to apply to the beer embedding
 */
export function getRatingWeight(rating: number): number {
  if (rating < 2) return 0.025;
  if (rating < 3) return 0.075;
  if (rating < 4) return 0.09;
  return 0.9;
}
