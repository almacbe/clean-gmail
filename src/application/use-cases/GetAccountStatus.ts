import type { GmailProfileReader } from '@/domain/repositories/GmailProfileReader';
import type { GetAccountStatusOutput } from '@/application/dtos/GetAccountStatusOutput';

export class GetAccountStatus {
  constructor(private readonly profileReader: GmailProfileReader) {}

  async execute(accessToken: string): Promise<GetAccountStatusOutput> {
    const profile = await this.profileReader.getProfile(accessToken);

    return {
      emailAddress: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
    };
  }
}
