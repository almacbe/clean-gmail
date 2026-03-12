// eslint-disable-next-line boundaries/element-types -- pragmatic NextAuth exception: server components call auth() directly
import { auth } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/presentation/components/ui/Header';
import { RecommendationsClient } from '@/presentation/components/features/RecommendationsClient';

export default async function RecommendationsPage() {
  const session = await auth();
  if (!session) redirect('/');

  if (session.error === 'RefreshTokenError') {
    redirect('/');
  }

  const email = session.user?.email ?? '';
  const image = session.user?.image ?? null;

  return (
    <div className="min-h-screen bg-base-200">
      <Header email={email} image={image} />
      <main>
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Recommendations</h1>
          <RecommendationsClient />
        </div>
      </main>
    </div>
  );
}
