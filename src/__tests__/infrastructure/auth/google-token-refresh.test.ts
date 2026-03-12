import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshGoogleAccessToken } from '@/infrastructure/auth/google-token-refresh';

describe('refreshGoogleAccessToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTH_GOOGLE_ID: 'test-client-id',
      AUTH_GOOGLE_SECRET: 'test-client-secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns accessToken and expiresAt on valid API response', async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        expires_in: 3600,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await refreshGoogleAccessToken('some-refresh-token');

    expect(result.error).toBeUndefined();
    if (!result.error) {
      expect(result.accessToken).toBe('new-access-token');
      expect(result.expiresAt).toBeGreaterThanOrEqual(now + 3600);
    }
  });

  it('returns RefreshTokenError on non-ok API response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', mockFetch);

    const result = await refreshGoogleAccessToken('some-refresh-token');

    expect(result).toEqual({ error: 'RefreshTokenError' });
  });

  it('returns RefreshTokenError when AUTH_GOOGLE_ID is missing', async () => {
    delete process.env.AUTH_GOOGLE_ID;
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await refreshGoogleAccessToken('some-refresh-token');

    expect(result).toEqual({ error: 'RefreshTokenError' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns RefreshTokenError when AUTH_GOOGLE_SECRET is missing', async () => {
    delete process.env.AUTH_GOOGLE_SECRET;
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await refreshGoogleAccessToken('some-refresh-token');

    expect(result).toEqual({ error: 'RefreshTokenError' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calculates expiresAt as Math.floor(Date.now() / 1000) + expires_in', async () => {
    const fakeNow = 1_700_000_000_000; // ms
    vi.spyOn(Date, 'now').mockReturnValue(fakeNow);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok', expires_in: 3600 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await refreshGoogleAccessToken('refresh-token');

    expect(result.error).toBeUndefined();
    if (!result.error) {
      expect(result.expiresAt).toBe(Math.floor(fakeNow / 1000) + 3600);
    }
  });
});
