import { GetAccountStatus } from '@/application/use-cases/GetAccountStatus';
import { GmailProfileAdapter } from '@/infrastructure/gmail/GmailProfileAdapter';

export function makeGetAccountStatusUseCase(): GetAccountStatus {
  const profileReader = new GmailProfileAdapter();
  return new GetAccountStatus(profileReader);
}
