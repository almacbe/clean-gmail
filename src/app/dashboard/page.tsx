// eslint-disable-next-line boundaries/element-types -- pragmatic NextAuth exception: server components call auth() directly
import { auth } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Header } from '@/presentation/components/ui/Header';
import { AccountStats } from '@/presentation/components/features/AccountStats';
import { LargeEmailsTable } from '@/presentation/components/features/LargeEmailsTable';
import type { GetAccountStatusOutput } from '@/application/dtos/GetAccountStatusOutput';
import type { ScanLargeEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';

type AccountStatusResponse =
  | (GetAccountStatusOutput & { error?: never })
  | { error: string };

type ScanResponse =
  | (ScanLargeEmailsOutput & { error?: never })
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

  const [accountResponse, scanResponse] = await Promise.all([
    fetch(`${baseUrl}/api/account-status`, {
      headers: { cookie },
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/scan/large-emails`, {
      headers: { cookie },
      cache: 'no-store',
    }),
  ]);

  let accountData: AccountStatusResponse;
  if (!accountResponse.ok) {
    accountData = { error: 'Failed to fetch account status' };
  } else {
    accountData = (await accountResponse.json()) as AccountStatusResponse;
  }

  let scanData: ScanResponse;
  if (!scanResponse.ok) {
    scanData = { error: 'Failed to scan emails' };
  } else {
    scanData = (await scanResponse.json()) as ScanResponse;
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
          <h2 className="text-xl font-bold mb-4">Large Emails (&gt;5 MB)</h2>
          {'error' in scanData && scanData.error ? (
            <div
              role="alert"
              data-testid="large-emails-error"
              className="alert alert-error"
            >
              <span>Failed to load large emails. Please try again.</span>
            </div>
          ) : (
            <LargeEmailsTable emails={scanData.emails} />
          )}
        </div>
      </main>
    </div>
  );
}
