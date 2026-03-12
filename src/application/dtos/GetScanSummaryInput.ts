import type { AgeThreshold } from '@/domain/value-objects/AgeThreshold';

export type { AgeThreshold };

export type GetScanSummaryInput = {
  readonly accessToken: string;
  readonly olderThan: AgeThreshold;
};
