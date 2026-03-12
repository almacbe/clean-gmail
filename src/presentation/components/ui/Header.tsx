import Image from 'next/image';
import { SignOutButton } from '@/presentation/components/ui/SignOutButton';

type HeaderProps = {
  email: string;
  image: string | null;
};

export function Header({ email, image }: HeaderProps) {
  return (
    <header className="navbar bg-base-100 shadow-sm px-4">
      <div className="flex-1">
        <span className="text-lg font-bold">Clean Gmail</span>
      </div>
      <div className="flex-none gap-3 items-center">
        <span className="text-sm hidden sm:inline">{email}</span>
        {image ? (
          <Image
            src={image}
            alt={`Avatar of ${email}`}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-8">
              <span className="text-xs">{email[0]?.toUpperCase() ?? '?'}</span>
            </div>
          </div>
        )}
        <SignOutButton />
      </div>
    </header>
  );
}
