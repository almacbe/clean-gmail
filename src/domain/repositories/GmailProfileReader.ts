import type { GmailProfile } from '@/domain/value-objects/GmailProfile';

export interface GmailProfileReader {
  getProfile(accessToken: string): Promise<GmailProfile>;
}
