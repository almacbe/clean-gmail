import type { Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';

const AUTH_SECRET =
  '000fa228893e216f8ad3a1b40f1278281cc4b5db7860e0332129255a058e2b9f';
const COOKIE_NAME = 'authjs.session-token';

/**
 * Sets a valid NextAuth v5 session cookie on the page so server-side `auth()`
 * treats the request as authenticated.
 */
export async function setAuthCookie(
  page: Page,
  user: { name: string; email: string; image?: string | null } = {
    name: 'Test User',
    email: 'testuser@gmail.com',
    image: null,
  },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const sessionToken = await encode({
    token: {
      name: user.name,
      email: user.email,
      picture: user.image ?? null,
      sub: 'e2e-test-user',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: now + 3600,
      iat: now,
      exp: now + 86400 * 30,
      jti: 'e2e-test-jti',
    },
    secret: AUTH_SECRET,
    salt: COOKIE_NAME,
  });

  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
