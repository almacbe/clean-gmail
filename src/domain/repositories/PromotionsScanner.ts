import type { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

export interface PromotionsScanner {
  /** Scans the user's Gmail inbox for promotional emails. */
  scanPromotions(accessToken: string): Promise<EmailMetadata[]>;
}
