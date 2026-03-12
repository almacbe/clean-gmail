import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

export type GetSelectionSummaryInput = {
  readonly selectedIds: ReadonlySet<string>;
  readonly emails: readonly EmailMetadataDto[];
};
