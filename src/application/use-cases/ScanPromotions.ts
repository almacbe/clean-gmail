import type { PromotionsScanner } from '@/domain/repositories/PromotionsScanner';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';

export class ScanPromotions {
  constructor(private readonly scanner: PromotionsScanner) {}

  async execute(accessToken: string): Promise<ScanEmailsOutput> {
    const emails = await this.scanner.scanPromotions(accessToken);

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
