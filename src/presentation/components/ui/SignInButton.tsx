'use client';

import { signIn } from 'next-auth/react';

export function SignInButton() {
  return (
    <button
      type="button"
      className="btn btn-primary"
      aria-label="Sign in with Google"
      onClick={() => signIn('google')}
    >
      Sign in with Google
    </button>
  );
}
