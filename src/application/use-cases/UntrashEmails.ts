import type { EmailUntrash } from '@/domain/repositories/EmailUntrash';
import type { UntrashEmailsInput } from '@/application/dtos/UntrashEmailsInput';
import type { UntrashEmailsOutput } from '@/application/dtos/UntrashEmailsOutput';

export class UntrashEmails {
  constructor(private readonly emailUntrash: EmailUntrash) {}

  async execute(input: UntrashEmailsInput): Promise<UntrashEmailsOutput> {
    if (input.ids.length === 0) {
      return { untrashedCount: 0 };
    }

    await this.emailUntrash.untrash(input.ids, input.accessToken);

    return { untrashedCount: input.ids.length };
  }
}
