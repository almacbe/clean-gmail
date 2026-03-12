import type { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

export interface SocialScanner {
  /** Scans the user's Gmail inbox for social emails. */
  scanSocial(accessToken: string): Promise<EmailMetadata[]>;
}
