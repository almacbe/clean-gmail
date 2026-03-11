import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/infrastructure/auth/google-token-refresh', () => ({
  refreshGoogleAccessToken: vi.fn(),
}));

import { refreshGoogleAccessToken } from '@/infrastructure/auth/google-token-refresh';

const mockRefresh = vi.mocked(refreshGoogleAccessToken);

async function getJwtCallback() {
  const { authConfig } = await import('@/infrastructure/auth/auth.config');
  const jwt = authConfig.callbacks?.jwt;
  if (!jwt) throw new Error('jwt callback not defined');
  return jwt;
}

async function getSessionCallback() {
  const { authConfig } = await import('@/infrastructure/auth/auth.config');
  const session = authConfig.callbacks?.session;
  if (!session) throw new Error('session callback not defined');
  return session;
}

describe('authConfig — Google provider', () => {
  it('includes gmail.readonly scope', async () => {
    const { authConfig } = await import('@/infrastructure/auth/auth.config');
    const google = authConfig.providers[0] as {
      options?: { authorization?: { params?: { scope?: string } } };
    };
    const scope = google?.options?.authorization?.params?.scope ?? '';
    expect(scope).toContain('https://www.googleapis.com/auth/gmail.readonly');
  });

  it('has access_type offline', async () => {
    const { authConfig } = await import('@/infrastructure/auth/auth.config');
    const google = authConfig.providers[0] as {
      options?: { authorization?: { params?: { access_type?: string } } };
    };
    expect(google?.options?.authorization?.params?.access_type).toBe('offline');
  });

  it('has prompt consent', async () => {
    const { authConfig } = await import('@/infrastructure/auth/auth.config');
    const google = authConfig.providers[0] as {
      options?: { authorization?: { params?: { prompt?: string } } };
    };
    expect(google?.options?.authorization?.params?.prompt).toBe('consent');
  });
});

describe('authConfig — jwt callback', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRefresh.mockReset();
  });

  it('stores accessToken, refreshToken, expiresAt on first sign-in (account present)', async () => {
    const jwt = await getJwtCallback();
    const token = { sub: 'user-id' } as Parameters<typeof jwt>[0]['token'];
    const account = {
      access_token: 'acc-token',
      refresh_token: 'ref-token',
      expires_at: 9999999,
    } as Parameters<typeof jwt>[0]['account'];

    const result = await jwt({
      token,
      account,
      trigger: 'signIn',
    } as Parameters<typeof jwt>[0]);

    expect(result).toMatchObject({
      accessToken: 'acc-token',
      refreshToken: 'ref-token',
      expiresAt: 9999999,
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('returns token unchanged when not expired', async () => {
    const jwt = await getJwtCallback();
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const token = {
      sub: 'user-id',
      accessToken: 'existing-token',
      refreshToken: 'ref-token',
      expiresAt: futureExpiry,
    } as Parameters<typeof jwt>[0]['token'];

    const result = await jwt({
      token,
      account: null,
      trigger: 'update',
    } as Parameters<typeof jwt>[0]);

    expect(result).toEqual(token);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('refreshes token when expired and refresh succeeds', async () => {
    const jwt = await getJwtCallback();
    const pastExpiry = Math.floor(Date.now() / 1000) - 100; // already expired
    const token = {
      sub: 'user-id',
      accessToken: 'old-token',
      refreshToken: 'ref-token',
      expiresAt: pastExpiry,
    } as Parameters<typeof jwt>[0]['token'];

    mockRefresh.mockResolvedValue({
      accessToken: 'new-token',
      expiresAt: pastExpiry + 3600,
      error: undefined,
    });

    const result = await jwt({
      token,
      account: null,
      trigger: 'update',
    } as Parameters<typeof jwt>[0]);

    expect(mockRefresh).toHaveBeenCalledWith('ref-token');
    expect(result).toMatchObject({
      accessToken: 'new-token',
      expiresAt: pastExpiry + 3600,
    });
    expect((result as { error?: unknown }).error).toBeUndefined();
  });

  it('sets error: RefreshTokenError when refresh fails', async () => {
    const jwt = await getJwtCallback();
    const pastExpiry = Math.floor(Date.now() / 1000) - 100;
    const token = {
      sub: 'user-id',
      accessToken: 'old-token',
      refreshToken: 'ref-token',
      expiresAt: pastExpiry,
    } as Parameters<typeof jwt>[0]['token'];

    mockRefresh.mockResolvedValue({ error: 'RefreshTokenError' });

    const result = await jwt({
      token,
      account: null,
      trigger: 'update',
    } as Parameters<typeof jwt>[0]);

    expect((result as { error?: unknown }).error).toBe('RefreshTokenError');
  });
});

describe('authConfig — session callback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('sets session.error when token has RefreshTokenError', async () => {
    const sessionCb = await getSessionCallback();
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '2099-01-01',
    };
    const token = {
      sub: 'user-id',
      accessToken: 'tok',
      refreshToken: 'ref',
      expiresAt: 0,
      error: 'RefreshTokenError' as const,
    };

    const result = await sessionCb({ session, token } as Parameters<
      typeof sessionCb
    >[0]);

    expect(result.error).toBe('RefreshTokenError');
  });

  it('does not expose accessToken or refreshToken in session', async () => {
    const sessionCb = await getSessionCallback();
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '2099-01-01',
    };
    const token = {
      sub: 'user-id',
      accessToken: 'secret-access-token',
      refreshToken: 'secret-refresh-token',
      expiresAt: 9999999,
    };

    const result = await sessionCb({ session, token } as Parameters<
      typeof sessionCb
    >[0]);

    expect((result as Record<string, unknown>)['accessToken']).toBeUndefined();
    expect((result as Record<string, unknown>)['refreshToken']).toBeUndefined();
  });

  it('does not set session.error when token has no error', async () => {
    const sessionCb = await getSessionCallback();
    const session = {
      user: { name: 'Test', email: 'test@example.com', image: null },
      expires: '2099-01-01',
    };
    const token = {
      sub: 'user-id',
      accessToken: 'tok',
      refreshToken: 'ref',
      expiresAt: 9999999,
    };

    const result = await sessionCb({ session, token } as Parameters<
      typeof sessionCb
    >[0]);

    expect(result.error).toBeUndefined();
  });
});
