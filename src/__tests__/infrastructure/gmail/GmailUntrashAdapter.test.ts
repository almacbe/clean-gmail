import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockUntrash, mockSetCredentials, mockGmail } = vi.hoisted(() => ({
  mockUntrash: vi.fn(),
  mockSetCredentials: vi.fn(),
  mockGmail: vi.fn(),
}));

vi.mock('googleapis', () => {
  function OAuth2() {
    return { setCredentials: mockSetCredentials };
  }

  return {
    google: {
      auth: { OAuth2 },
      gmail: mockGmail,
    },
  };
});

import { GmailUntrashAdapter } from '@/infrastructure/gmail/GmailUntrashAdapter';

function setupGmailMock() {
  mockGmail.mockReturnValue({
    users: { messages: { untrash: mockUntrash } },
  });
}

describe('GmailUntrashAdapter', () => {
  beforeEach(() => {
    mockUntrash.mockReset();
    mockGmail.mockReset();
    mockUntrash.mockResolvedValue({});
    setupGmailMock();
  });

  it('makes no API calls when ids array is empty', async () => {
    const delay = vi.fn();
    const adapter = new GmailUntrashAdapter(delay);

    await adapter.untrash([], 'token');

    expect(mockUntrash).not.toHaveBeenCalled();
  });

  it('calls messages.untrash once per id with userId me', async () => {
    const delay = vi.fn();
    const adapter = new GmailUntrashAdapter(delay);

    await adapter.untrash(['id1', 'id2', 'id3'], 'token');

    expect(mockUntrash).toHaveBeenCalledTimes(3);
    expect(mockUntrash).toHaveBeenCalledWith({ userId: 'me', id: 'id1' });
    expect(mockUntrash).toHaveBeenCalledWith({ userId: 'me', id: 'id2' });
    expect(mockUntrash).toHaveBeenCalledWith({ userId: 'me', id: 'id3' });
  });

  it('processes 51 ids across 2 chunks (50 + 1)', async () => {
    const delay = vi.fn();
    const adapter = new GmailUntrashAdapter(delay);

    const ids = Array.from({ length: 51 }, (_, i) => `id${i}`);
    await adapter.untrash(ids, 'token');

    expect(mockUntrash).toHaveBeenCalledTimes(51);
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    const delay = vi.fn().mockResolvedValue(undefined);
    const adapter = new GmailUntrashAdapter(delay);

    mockUntrash.mockRejectedValueOnce({ code: 429 }).mockResolvedValueOnce({});

    await adapter.untrash(['id1'], 'token');

    expect(mockUntrash).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledWith(100);
  });

  it('does not retry on 403 and propagates the error', async () => {
    const delay = vi.fn();
    const adapter = new GmailUntrashAdapter(delay);

    mockUntrash.mockRejectedValue({ code: 403 });

    await expect(adapter.untrash(['id1'], 'token')).rejects.toMatchObject({
      code: 403,
    });

    expect(mockUntrash).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
  });
});
