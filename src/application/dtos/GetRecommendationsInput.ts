import type { EmailMetadataDto } from './ScanLargeEmailsOutput';

export interface GetRecommendationsInput {
  readonly largeEmails: readonly EmailMetadataDto[];
  readonly promotions: readonly EmailMetadataDto[];
  readonly social: readonly EmailMetadataDto[];
  readonly oldEmails: readonly EmailMetadataDto[];
}
