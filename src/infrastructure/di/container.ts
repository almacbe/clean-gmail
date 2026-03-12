import { GetAccountStatus } from '@/application/use-cases/GetAccountStatus';
import { ScanLargeEmails } from '@/application/use-cases/ScanLargeEmails';
import { GmailProfileAdapter } from '@/infrastructure/gmail/GmailProfileAdapter';
import { GmailLargeEmailAdapter } from '@/infrastructure/gmail/GmailLargeEmailAdapter';

export function makeGetAccountStatusUseCase(): GetAccountStatus {
  const profileReader = new GmailProfileAdapter();
  return new GetAccountStatus(profileReader);
}

export function makeScanLargeEmailsUseCase(): ScanLargeEmails {
  const scanner = new GmailLargeEmailAdapter();
  return new ScanLargeEmails(scanner);
}
