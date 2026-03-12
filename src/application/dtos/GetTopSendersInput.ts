import type { EmailMetadataDto } from './ScanLargeEmailsOutput';

export interface GetTopSendersInput {
  readonly emails: readonly EmailMetadataDto[];
}
