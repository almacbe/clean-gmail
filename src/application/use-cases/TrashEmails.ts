import type { EmailDeleter } from '@/domain/repositories/EmailDeleter';
import type { TrashEmailsInput } from '@/application/dtos/TrashEmailsInput';
import type { TrashEmailsOutput } from '@/application/dtos/TrashEmailsOutput';

export class TrashEmails {
  constructor(private readonly emailDeleter: EmailDeleter) {}

  async execute(input: TrashEmailsInput): Promise<TrashEmailsOutput> {
    if (input.ids.length === 0) {
      return { trashedCount: 0 };
    }

    await this.emailDeleter.trash(input.ids, input.accessToken);

    return { trashedCount: input.ids.length };
  }
}
