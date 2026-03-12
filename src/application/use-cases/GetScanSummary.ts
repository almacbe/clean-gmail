import type { LargeEmailScanner } from '@/domain/repositories/LargeEmailScanner';
import type { PromotionsScanner } from '@/domain/repositories/PromotionsScanner';
import type { SocialScanner } from '@/domain/repositories/SocialScanner';
import type { OldEmailsScanner } from '@/domain/repositories/OldEmailsScanner';
import type { EmailMetadata } from '@/domain/value-objects/EmailMetadata';
import type { GetScanSummaryInput } from '@/application/dtos/GetScanSummaryInput';
import type {
  CategorySummary,
  GetScanSummaryOutput,
} from '@/application/dtos/GetScanSummaryOutput';

const EMPTY_SUMMARY: CategorySummary = { count: 0, totalSizeBytes: 0 };

function summarise(emails: EmailMetadata[]): CategorySummary {
  return {
    count: emails.length,
    totalSizeBytes: emails.reduce((sum, e) => sum + e.sizeEstimate, 0),
  };
}

export class GetScanSummary {
  constructor(
    private readonly largeEmailScanner: LargeEmailScanner,
    private readonly promotionsScanner: PromotionsScanner,
    private readonly socialScanner: SocialScanner,
    private readonly oldEmailsScanner: OldEmailsScanner,
  ) {}

  async execute(input: GetScanSummaryInput): Promise<GetScanSummaryOutput> {
    const [largeResult, promotionsResult, socialResult, oldEmailsResult] =
      await Promise.allSettled([
        this.largeEmailScanner.scanLargeEmails(input.accessToken),
        this.promotionsScanner.scanPromotions(input.accessToken),
        this.socialScanner.scanSocial(input.accessToken),
        this.oldEmailsScanner.scanOldEmails(input.accessToken, input.olderThan),
      ]);

    return {
      largeEmails:
        largeResult.status === 'fulfilled'
          ? summarise(largeResult.value)
          : EMPTY_SUMMARY,
      promotions:
        promotionsResult.status === 'fulfilled'
          ? summarise(promotionsResult.value)
          : EMPTY_SUMMARY,
      social:
        socialResult.status === 'fulfilled'
          ? summarise(socialResult.value)
          : EMPTY_SUMMARY,
      oldEmails:
        oldEmailsResult.status === 'fulfilled'
          ? summarise(oldEmailsResult.value)
          : EMPTY_SUMMARY,
    };
  }
}
