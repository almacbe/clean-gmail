import type { SocialScanner } from '@/domain/repositories/SocialScanner';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';

export class ScanSocial {
  constructor(private readonly scanner: SocialScanner) {}

  async execute(accessToken: string): Promise<ScanEmailsOutput> {
    const emails = await this.scanner.scanSocial(accessToken);

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
