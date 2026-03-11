import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth', () => {
  const mockHandlers = {
    GET: vi.fn(),
    POST: vi.fn(),
  };
  return {
    default: vi.fn(() => ({
      handlers: mockHandlers,
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    })),
  };
});

describe('Auth configuration', () => {
  it('uses JWT session strategy', async () => {
    const { authConfig } = await import('@/infrastructure/auth/auth.config');
    expect(authConfig.session?.strategy).toBe('jwt');
  });

  it('has at least one provider configured', async () => {
    const { authConfig } = await import('@/infrastructure/auth/auth.config');
    expect(authConfig.providers.length).toBeGreaterThanOrEqual(1);
  });

  it('Google provider authorization params include gmail.readonly scope', async () => {
    const { authConfig } = await import('@/infrastructure/auth/auth.config');
    const google = authConfig.providers[0] as {
      options?: { authorization?: { params?: { scope?: string } } };
    };
    const scope = google?.options?.authorization?.params?.scope ?? '';
    expect(scope).toContain('https://www.googleapis.com/auth/gmail.readonly');
  });
});

describe('Auth exports', () => {
  it('exports handlers with GET and POST', async () => {
    const { handlers } = await import('@/infrastructure/auth/auth');
    expect(handlers).toBeDefined();
    expect(handlers.GET).toBeDefined();
    expect(handlers.POST).toBeDefined();
  });

  it('exports auth function', async () => {
    const { auth } = await import('@/infrastructure/auth/auth');
    expect(auth).toBeDefined();
    expect(typeof auth).toBe('function');
  });

  it('exports signIn function', async () => {
    const { signIn } = await import('@/infrastructure/auth/auth');
    expect(signIn).toBeDefined();
    expect(typeof signIn).toBe('function');
  });

  it('exports signOut function', async () => {
    const { signOut } = await import('@/infrastructure/auth/auth');
    expect(signOut).toBeDefined();
    expect(typeof signOut).toBe('function');
  });
});
