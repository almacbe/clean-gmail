// eslint-disable-next-line boundaries/element-types -- pragmatic NextAuth exception: server components call auth() directly
import { auth } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/');

  // Error state: refresh token failed — force re-authentication
  if (session.error === 'RefreshTokenError') {
    redirect('/');
  }

  return (
    <main className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Clean Gmail</h1>
          <p className="py-6">
            You are signed in as {session.user?.email ?? 'unknown'}.
          </p>
          <p className="text-sm text-base-content/60">
            Account stats and cleanup tools coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
