import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    error?: 'RefreshTokenError';
    // accessToken intentionally NOT exposed in client session —
    // available server-side only via auth() for Gmail API calls
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // unix timestamp (seconds)
    error?: 'RefreshTokenError';
  }
}
