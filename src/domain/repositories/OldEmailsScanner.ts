import type { AgeThreshold } from '@/domain/value-objects/AgeThreshold';
import type { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

/** Port: scans Gmail for emails older than a given threshold. */
export interface OldEmailsScanner {
  scanOldEmails(
    accessToken: string,
    olderThan: AgeThreshold,
  ): Promise<EmailMetadata[]>;
}
