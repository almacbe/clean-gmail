/** Supported age thresholds for old-email scans. */
export type AgeThreshold = '6m' | '1y' | '2y' | '5y';

/** All valid AgeThreshold values, for runtime validation. */
export const AGE_THRESHOLDS: readonly AgeThreshold[] = [
  '6m',
  '1y',
  '2y',
  '5y',
] as const;
