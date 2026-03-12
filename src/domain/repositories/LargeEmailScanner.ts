import type { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

export interface LargeEmailScanner {
  scanLargeEmails(accessToken: string): Promise<EmailMetadata[]>;
}
