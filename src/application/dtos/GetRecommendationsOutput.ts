export interface RecommendationDto {
  readonly category: string;
  readonly emailCount: number;
  readonly totalSizeBytes: number;
}

export interface GetRecommendationsOutput {
  readonly recommendations: readonly RecommendationDto[];
}
