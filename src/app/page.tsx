// eslint-disable-next-line boundaries/element-types -- pragmatic NextAuth exception: server components call auth() directly
import { auth } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { SignInButton } from '@/presentation/components/ui/SignInButton';

export default async function Home() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Clean Gmail</h1>
          <p className="py-6">
            Analyze your Gmail inbox and free up storage by finding and removing
            emails you no longer need.
          </p>
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
