import { GetAccountStatus } from '@/application/use-cases/GetAccountStatus';
import { TrashEmails } from '@/application/use-cases/TrashEmails';
import { GetScanSummary } from '@/application/use-cases/GetScanSummary';
import { ScanLargeEmails } from '@/application/use-cases/ScanLargeEmails';
import { ScanOldEmails } from '@/application/use-cases/ScanOldEmails';
import { ScanPromotions } from '@/application/use-cases/ScanPromotions';
import { ScanSocial } from '@/application/use-cases/ScanSocial';
import { GmailProfileAdapter } from '@/infrastructure/gmail/GmailProfileAdapter';
import { GmailTrashAdapter } from '@/infrastructure/gmail/GmailTrashAdapter';
import { GmailLargeEmailAdapter } from '@/infrastructure/gmail/GmailLargeEmailAdapter';
import { GmailOldEmailsAdapter } from '@/infrastructure/gmail/GmailOldEmailsAdapter';
import { GmailPromotionsAdapter } from '@/infrastructure/gmail/GmailPromotionsAdapter';
import { GmailSocialAdapter } from '@/infrastructure/gmail/GmailSocialAdapter';

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

export function makeScanSocialUseCase(): ScanSocial {
  const scanner = new GmailSocialAdapter();
  return new ScanSocial(scanner);
}

export function makeScanOldEmailsUseCase(): ScanOldEmails {
  const scanner = new GmailOldEmailsAdapter();
  return new ScanOldEmails(scanner);
}

export function makeTrashEmailsUseCase(): TrashEmails {
  return new TrashEmails(new GmailTrashAdapter());
}

export function makeGetScanSummaryUseCase(): GetScanSummary {
  return new GetScanSummary(
    new GmailLargeEmailAdapter(),
    new GmailPromotionsAdapter(),
    new GmailSocialAdapter(),
    new GmailOldEmailsAdapter(),
  );
}
