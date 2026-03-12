import { GetAccountStatus } from '@/application/use-cases/GetAccountStatus';
import { ScanLargeEmails } from '@/application/use-cases/ScanLargeEmails';
import { ScanPromotions } from '@/application/use-cases/ScanPromotions';
import { GmailProfileAdapter } from '@/infrastructure/gmail/GmailProfileAdapter';
import { GmailLargeEmailAdapter } from '@/infrastructure/gmail/GmailLargeEmailAdapter';
import { GmailPromotionsAdapter } from '@/infrastructure/gmail/GmailPromotionsAdapter';

export function makeGetAccountStatusUseCase(): GetAccountStatus {
  const profileReader = new GmailProfileAdapter();
  return new GetAccountStatus(profileReader);
}

export function makeScanLargeEmailsUseCase(): ScanLargeEmails {
  const scanner = new GmailLargeEmailAdapter();
  return new ScanLargeEmails(scanner);
}

export function makeScanPromotionsUseCase(): ScanPromotions {
  const scanner = new GmailPromotionsAdapter();
  return new ScanPromotions(scanner);
}
