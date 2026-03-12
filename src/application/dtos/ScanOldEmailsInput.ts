import type { AgeThreshold } from '@/domain/value-objects/AgeThreshold';

export type { AgeThreshold };

export type ScanOldEmailsInput = {
  readonly accessToken: string;
  readonly olderThan: AgeThreshold;
};
