import type { OldEmailsScanner } from '@/domain/repositories/OldEmailsScanner';
import type { ScanOldEmailsInput } from '@/application/dtos/ScanOldEmailsInput';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';

export class ScanOldEmails {
  constructor(private readonly scanner: OldEmailsScanner) {}

  async execute(input: ScanOldEmailsInput): Promise<ScanEmailsOutput> {
    const emails = await this.scanner.scanOldEmails(
      input.accessToken,
      input.olderThan,
    );

    return {
      emails: emails.map((email) => ({
        id: email.id,
        sender: email.sender,
        subject: email.subject,
        date: email.date.toISOString(),
        sizeEstimate: email.sizeEstimate,
      })),
    };
  }
}
