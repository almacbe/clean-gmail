import { google } from 'googleapis';
import type { GmailProfileReader } from '@/domain/repositories/GmailProfileReader';
import { GmailProfile } from '@/domain/value-objects/GmailProfile';

export class GmailProfileAdapter implements GmailProfileReader {
  async getProfile(accessToken: string): Promise<GmailProfile> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.getProfile({ userId: 'me' });

    const { emailAddress, messagesTotal, threadsTotal } = response.data;

    return GmailProfile.create(
      emailAddress ?? '',
      messagesTotal ?? 0,
      threadsTotal ?? 0,
    );
  }
}
