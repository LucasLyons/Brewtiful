/**
 * Configuration for multi-level diversity ranking in k-means recommendations
 *
 * Tunable parameters control the balance between:
 * - Quality vs similarity
 * - Inter-cluster diversity (different taste profiles)
 * - Intra-cluster diversity (avoiding near-duplicates)
 */

export interface RankingParams {
  /**
   * Bias term exponent - controls influence of LightFM bias_term on scoring
   * Range: 0.0 - 1.0
   * Default: 0.1 (dampens bias_term to prevent overpowering similarity)
   * Higher = more quality-focused, Lower = more similarity-focused
   */
  alpha: number;

  /**
   * Cluster selection decay rate - controls inter-cluster diversity
   * Range: 0.1 - 0.5
   * Default: 0.2 (moderate decay)
   * Higher = more even distribution across clusters
   * Lower = quality clusters dominate more
   */
  lambda: number;

  /**
   * Intra-cluster diversity weight - penalizes similar items within same cluster
   * Range: 0.2 - 0.8
   * Default: 0.5 (50/50 balance)
   * Higher = more diverse within cluster
   * Lower = more quality-focused within cluster
   */
  beta: number;

  /**
   * Similarity threshold for diversity penalty
   * Range: 0.5 - 0.8
   * Default: 0.65 (matches cluster validation threshold)
   * Only items more similar than this get penalized
   */
  threshold: number;

  /**
   * Number of top items to average for cluster quality calculation
   * Range: 3 - 10
   * Default: 5
   * Higher = more stable cluster weights
   * Lower = more influenced by single best item
   */
  topK: number;
}

/**
 * Default ranking parameters loaded from environment variables
 */
export const RANKING_PARAMS: RankingParams = {
  alpha: parseFloat(process.env.NEXT_PUBLIC_BIAS_ALPHA ?? '0.1'),
  lambda: parseFloat(process.env.NEXT_PUBLIC_CLUSTER_DECAY_LAMBDA ?? '0.1'),
  beta: parseFloat(process.env.NEXT_PUBLIC_DIVERSITY_BETA ?? '0.2'),
  threshold: parseFloat(process.env.NEXT_PUBLIC_SIMILARITY_THRESHOLD ?? '0.65'),
  topK: parseInt(process.env.NEXT_PUBLIC_CLUSTER_TOP_K ?? '5', 10),
};

/**
 * Validate ranking parameters are within acceptable ranges
 */
export function validateRankingParams(params: RankingParams): void {
  if (params.alpha < 0.0 || params.alpha > 1.0) {
    throw new Error(`alpha must be between 0.0 and 1.0, got ${params.alpha}`);
  }
  if (params.lambda < 0.1 || params.lambda > 0.5) {
    throw new Error(`lambda must be between 0.1 and 0.5, got ${params.lambda}`);
  }
  if (params.beta < 0.2 || params.beta > 0.8) {
    throw new Error(`beta must be between 0.2 and 0.8, got ${params.beta}`);
  }
  if (params.threshold < 0.5 || params.threshold > 0.8) {
    throw new Error(`threshold must be between 0.5 and 0.8, got ${params.threshold}`);
  }
  if (params.topK < 3 || params.topK > 10) {
    throw new Error(`topK must be between 3 and 10, got ${params.topK}`);
  }
}
