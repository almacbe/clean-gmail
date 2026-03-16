import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { refreshGoogleAccessToken } from './google-token-refresh';

// 60-second buffer before treating the token as expired
const TOKEN_REFRESH_BUFFER_MS = 60_000;

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
          ].join(' '),
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      // First sign-in: account is populated by NextAuth with Google's response
      if (account) {
        return {
          ...token,
          accessToken: account.access_token ?? '',
          refreshToken: account.refresh_token ?? '',
          expiresAt: account.expires_at ?? 0,
        };
      }

      // Token still valid — return as-is
      const isExpired =
        Date.now() >= token.expiresAt * 1000 - TOKEN_REFRESH_BUFFER_MS;
      if (!isExpired) {
        return token;
      }

      // Token expired — refresh it
      const result = await refreshGoogleAccessToken(token.refreshToken);
      if (result.error) {
        return { ...token, error: 'RefreshTokenError' as const };
      }

      return {
        ...token,
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        error: undefined,
      };
    },

    async session({ session, token }) {
      // Only surface the error state — never forward raw tokens to the client session
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
};
