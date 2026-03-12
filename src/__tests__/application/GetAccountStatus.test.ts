import { describe, it, expect, vi } from 'vitest';
import { GetAccountStatus } from '@/application/use-cases/GetAccountStatus';
import type { GmailProfileReader } from '@/domain/repositories/GmailProfileReader';
import { GmailProfile } from '@/domain/value-objects/GmailProfile';
import { InvalidGmailProfileError } from '@/domain/errors/InvalidGmailProfileError';

function makeReader(
  impl: Partial<GmailProfileReader> = {},
): GmailProfileReader {
  return {
    getProfile: vi.fn(),
    ...impl,
  };
}

describe('GetAccountStatus', () => {
  it('returns DTO matching the profile on happy path', async () => {
    const profile = GmailProfile.create('user@example.com', 1500, 800);
    const reader = makeReader({
      getProfile: vi.fn().mockResolvedValue(profile),
    });
    const useCase = new GetAccountStatus(reader);

    const result = await useCase.execute('test-access-token');

    expect(result).toEqual({
      emailAddress: 'user@example.com',
      messagesTotal: 1500,
      threadsTotal: 800,
    });
  });

  it('returns correct DTO when messagesTotal and threadsTotal are zero', async () => {
    const profile = GmailProfile.create('empty@example.com', 0, 0);
    const reader = makeReader({
      getProfile: vi.fn().mockResolvedValue(profile),
    });
    const useCase = new GetAccountStatus(reader);

    const result = await useCase.execute('test-access-token');

    expect(result).toEqual({
      emailAddress: 'empty@example.com',
      messagesTotal: 0,
      threadsTotal: 0,
    });
  });

  it('propagates network errors from the reader', async () => {
    const networkError = new Error('Network error');
    const reader = makeReader({
      getProfile: vi.fn().mockRejectedValue(networkError),
    });
    const useCase = new GetAccountStatus(reader);

    await expect(useCase.execute('test-access-token')).rejects.toThrow(
      'Network error',
    );
  });

  it('propagates InvalidGmailProfileError from the reader', async () => {
    const domainError = new InvalidGmailProfileError('bad data');
    const reader = makeReader({
      getProfile: vi.fn().mockRejectedValue(domainError),
    });
    const useCase = new GetAccountStatus(reader);

    await expect(useCase.execute('test-access-token')).rejects.toThrow(
      InvalidGmailProfileError,
    );
  });

  it('passes the accessToken to the reader', async () => {
    const profile = GmailProfile.create('user@example.com', 10, 5);
    const getProfile = vi.fn().mockResolvedValue(profile);
    const reader = makeReader({ getProfile });
    const useCase = new GetAccountStatus(reader);

    await useCase.execute('my-secret-token');

    expect(getProfile).toHaveBeenCalledWith('my-secret-token');
  });
});
