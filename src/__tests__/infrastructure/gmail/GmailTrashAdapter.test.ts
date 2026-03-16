import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockTrash, mockSetCredentials, mockGmail } = vi.hoisted(() => ({
  mockTrash: vi.fn(),
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

import { GmailTrashAdapter } from '@/infrastructure/gmail/GmailTrashAdapter';

function setupGmailMock() {
  mockGmail.mockReturnValue({
    users: { messages: { trash: mockTrash } },
  });
}

describe('GmailTrashAdapter', () => {
  beforeEach(() => {
    mockTrash.mockReset();
    mockGmail.mockReset();
    mockTrash.mockResolvedValue({});
    setupGmailMock();
  });

  it('makes no API calls when ids array is empty', async () => {
    const delay = vi.fn();
    const adapter = new GmailTrashAdapter(delay);

    await adapter.trash([], 'token');

    expect(mockTrash).not.toHaveBeenCalled();
  });

  it('calls messages.trash once per id with userId me', async () => {
    const delay = vi.fn();
    const adapter = new GmailTrashAdapter(delay);

    await adapter.trash(['id1', 'id2', 'id3'], 'token');

    expect(mockTrash).toHaveBeenCalledTimes(3);
    expect(mockTrash).toHaveBeenCalledWith({ userId: 'me', id: 'id1' });
    expect(mockTrash).toHaveBeenCalledWith({ userId: 'me', id: 'id2' });
    expect(mockTrash).toHaveBeenCalledWith({ userId: 'me', id: 'id3' });
  });

  it('processes 51 ids across 2 chunks (50 + 1)', async () => {
    const delay = vi.fn();
    const adapter = new GmailTrashAdapter(delay);

    const ids = Array.from({ length: 51 }, (_, i) => `id${i}`);
    await adapter.trash(ids, 'token');

    expect(mockTrash).toHaveBeenCalledTimes(51);
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    const delay = vi.fn().mockResolvedValue(undefined);
    const adapter = new GmailTrashAdapter(delay);

    mockTrash.mockRejectedValueOnce({ code: 429 }).mockResolvedValueOnce({});

    await adapter.trash(['id1'], 'token');

    expect(mockTrash).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledWith(100);
  });

  it('does not retry on 403 and propagates the error', async () => {
    const delay = vi.fn();
    const adapter = new GmailTrashAdapter(delay);

    mockTrash.mockRejectedValue({ code: 403 });

    await expect(adapter.trash(['id1'], 'token')).rejects.toMatchObject({
      code: 403,
    });

    expect(mockTrash).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
  });
});
