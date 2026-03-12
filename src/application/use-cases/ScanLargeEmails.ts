import type { LargeEmailScanner } from '@/domain/repositories/LargeEmailScanner';
import type { ScanLargeEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';

export class ScanLargeEmails {
  constructor(private readonly scanner: LargeEmailScanner) {}

  async execute(accessToken: string): Promise<ScanLargeEmailsOutput> {
    const emails = await this.scanner.scanLargeEmails(accessToken);

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
