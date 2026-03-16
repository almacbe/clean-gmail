import { google } from 'googleapis';
import type { EmailDeleter } from '@/domain/repositories/EmailDeleter';

const CHUNK_SIZE = 50;
const MAX_RETRIES = 3;
const RETRYABLE_CODES = new Set([429, 500]);

const defaultDelay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class GmailTrashAdapter implements EmailDeleter {
  private readonly delay: (ms: number) => Promise<void>;

  constructor(delay: (ms: number) => Promise<void> = defaultDelay) {
    this.delay = delay;
  }

  async trash(ids: readonly string[], accessToken: string): Promise<void> {
    if (ids.length === 0) return;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + CHUNK_SIZE) as string[]);
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((id) =>
          this.withRetry(() =>
            gmail.users.messages.trash({ userId: 'me', id }),
          ),
        ),
      );
    }
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
