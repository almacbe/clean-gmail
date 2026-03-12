import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

export type GetDeletePreviewInput = {
  readonly selectedIds: ReadonlySet<string>;
  readonly emails: readonly EmailMetadataDto[];
};
