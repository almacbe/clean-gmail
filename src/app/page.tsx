import { SignInButton } from '@/presentation/components/ui/SignInButton';

export default function Home() {
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
