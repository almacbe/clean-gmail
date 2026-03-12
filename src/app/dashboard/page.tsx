// eslint-disable-next-line boundaries/element-types -- pragmatic NextAuth exception: server components call auth() directly
import { auth } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Header } from '@/presentation/components/ui/Header';
import { AccountStats } from '@/presentation/components/features/AccountStats';
import { DashboardClient } from '@/presentation/components/features/DashboardClient';
import type { GetAccountStatusOutput } from '@/application/dtos/GetAccountStatusOutput';

type AccountStatusResponse =
  | (GetAccountStatusOutput & { error?: never })
  | { error: string };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/');

  if (session.error === 'RefreshTokenError') {
    redirect('/');
  }

  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get('cookie') ?? '';

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const accountResponse = await fetch(`${baseUrl}/api/account-status`, {
    headers: { cookie },
    cache: 'no-store',
  });

  let accountData: AccountStatusResponse;
  if (!accountResponse.ok) {
    accountData = { error: 'Failed to fetch account status' };
  } else {
    accountData = (await accountResponse.json()) as AccountStatusResponse;
  }

  const email = session.user?.email ?? '';
  const image = session.user?.image ?? null;

  return (
    <div className="min-h-screen bg-base-200">
      <Header email={email} image={image} />
      <main>
        {'error' in accountData && accountData.error ? (
          <div className="p-6 max-w-4xl mx-auto">
            <div role="alert" className="alert alert-error">
              <span>{accountData.error}</span>
            </div>
          </div>
        ) : (
          <AccountStats
            emailAddress={(accountData as GetAccountStatusOutput).emailAddress}
            messagesTotal={
              (accountData as GetAccountStatusOutput).messagesTotal
            }
            threadsTotal={(accountData as GetAccountStatusOutput).threadsTotal}
          />
        )}
        <div className="p-6 max-w-4xl mx-auto">
          <DashboardClient />
        </div>
      </main>
    </div>
  );
}
