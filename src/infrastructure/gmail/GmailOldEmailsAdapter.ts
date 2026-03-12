import { google } from 'googleapis';
import type { OldEmailsScanner } from '@/domain/repositories/OldEmailsScanner';
import type { AgeThreshold } from '@/domain/value-objects/AgeThreshold';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

const CHUNK_SIZE = 100;
const MAX_RETRIES = 3;
const RETRYABLE_CODES = new Set([429, 500]);
const MAX_RESULTS_PER_PAGE = 100;
const MAX_PAGES = 5; // cap at 500 old emails

const defaultDelay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class GmailOldEmailsAdapter implements OldEmailsScanner {
  private readonly delay: (ms: number) => Promise<void>;

  constructor(delay: (ms: number) => Promise<void> = defaultDelay) {
    this.delay = delay;
  }

  async scanOldEmails(
    accessToken: string,
    olderThan: AgeThreshold,
  ): Promise<EmailMetadata[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Step 1: Paginate messages.list to collect IDs (capped at MAX_PAGES pages)
    const messageIds: string[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;

    do {
      const listResponse = await this.withRetry(() =>
        gmail.users.messages.list({
          userId: 'me',
          q: `older_than:${olderThan}`,
          maxResults: MAX_RESULTS_PER_PAGE,
          ...(pageToken ? { pageToken } : {}),
        }),
      );
      pageCount++;

      const messages = listResponse.data.messages ?? [];
      for (const msg of messages) {
        if (msg.id) {
          messageIds.push(msg.id);
        }
      }

      pageToken = listResponse.data.nextPageToken ?? undefined;
    } while (pageToken !== undefined && pageCount < MAX_PAGES);

    if (messageIds.length === 0) {
      return [];
    }

    // Step 2: Chunk IDs and fetch metadata in parallel per chunk
    const chunks: string[][] = [];
    for (let i = 0; i < messageIds.length; i += CHUNK_SIZE) {
      chunks.push(messageIds.slice(i, i + CHUNK_SIZE));
    }

    const allMetadata: EmailMetadata[] = [];

    for (const chunk of chunks) {
      const metadataResults = await Promise.all(
        chunk.map((id) =>
          this.withRetry(() =>
            gmail.users.messages.get({
              userId: 'me',
              id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date'],
            }),
          ),
        ),
      );

      for (const result of metadataResults) {
        const msg = result.data;
        const headers = msg.payload?.headers ?? [];

        const getHeader = (name: string): string => {
          const header = headers.find(
            (h) => h.name?.toLowerCase() === name.toLowerCase(),
          );
          return header?.value ?? '';
        };

        const sender = getHeader('From');
        const subject = getHeader('Subject');
        const dateStr = getHeader('Date');
        const parsed = dateStr ? new Date(dateStr) : new Date(0);
        const date = isNaN(parsed.getTime()) ? new Date(0) : parsed;
        const sizeEstimate = msg.sizeEstimate ?? 0;

        allMetadata.push(
          EmailMetadata.create(
            msg.id ?? '',
            sender,
            subject,
            date,
            sizeEstimate,
          ),
        );
      }
    }

    return allMetadata;
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;

        const code = this.getErrorCode(err);
        if (!RETRYABLE_CODES.has(code)) {
          throw err;
        }

        if (attempt < MAX_RETRIES - 1) {
          const delayMs = Math.pow(2, attempt) * 100;
          await this.delay(delayMs);
        }
      }
    }

    throw lastError;
  }

  private getErrorCode(err: unknown): number {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      typeof (err as { code: unknown }).code === 'number'
    ) {
      return (err as { code: number }).code;
    }
    if (
      err !== null &&
      typeof err === 'object' &&
      'status' in err &&
      typeof (err as { status: unknown }).status === 'number'
    ) {
      return (err as { status: number }).status;
    }
    return 0;
  }
}
