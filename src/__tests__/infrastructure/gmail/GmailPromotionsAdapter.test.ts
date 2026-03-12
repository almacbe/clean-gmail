import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

const { mockMessagesList, mockMessagesGet, mockSetCredentials, mockGmail } =
  vi.hoisted(() => ({
    mockMessagesList: vi.fn(),
    mockMessagesGet: vi.fn(),
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

import { GmailPromotionsAdapter } from '@/infrastructure/gmail/GmailPromotionsAdapter';

const makeMessageListResponse = (ids: string[], nextPageToken?: string) => ({
  data: {
    messages: ids.map((id) => ({ id })),
    ...(nextPageToken ? { nextPageToken } : {}),
  },
});

const makeMessageGetResponse = (
  id: string,
  options: {
    sender?: string;
    subject?: string;
    date?: string;
    sizeEstimate?: number;
  } = {},
) => ({
  data: {
    id,
    sizeEstimate: options.sizeEstimate ?? 200000,
    payload: {
      headers: [
        { name: 'From', value: options.sender ?? 'promo@example.com' },
        { name: 'Subject', value: options.subject ?? 'Test Promo' },
        {
          name: 'Date',
          value: options.date ?? 'Mon, 15 Jan 2024 10:00:00 +0000',
        },
      ],
    },
  },
});

describe('GmailPromotionsAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGmail.mockReturnValue({
      users: {
        messages: {
          list: mockMessagesList,
          get: mockMessagesGet,
        },
      },
    });
  });

  it('calls messages.list with q: "category:promotions"', async () => {
    mockMessagesList.mockResolvedValue(makeMessageListResponse([]));

    const adapter = new GmailPromotionsAdapter();
    await adapter.scanPromotions('test-token');

    expect(mockMessagesList).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'category:promotions', userId: 'me' }),
    );
  });

  it('paginates on nextPageToken — messages.list called twice', async () => {
    mockMessagesList
      .mockResolvedValueOnce(makeMessageListResponse(['id-1', 'id-2'], 'page2'))
      .mockResolvedValueOnce(makeMessageListResponse(['id-3']));

    mockMessagesGet.mockImplementation((params: { id: string }) =>
      Promise.resolve(makeMessageGetResponse(params.id)),
    );

    const adapter = new GmailPromotionsAdapter();
    await adapter.scanPromotions('test-token');

    expect(mockMessagesList).toHaveBeenCalledTimes(2);
    expect(mockMessagesList).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pageToken: 'page2' }),
    );
  });

  it('calls messages.get with format: "metadata" and correct metadataHeaders', async () => {
    mockMessagesList.mockResolvedValue(makeMessageListResponse(['id-1']));
    mockMessagesGet.mockResolvedValue(makeMessageGetResponse('id-1'));

    const adapter = new GmailPromotionsAdapter();
    await adapter.scanPromotions('test-token');

    expect(mockMessagesGet).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
        userId: 'me',
        id: 'id-1',
      }),
    );
  });

  it('batches 150 IDs in chunks of 100 — messages.get called 150 times', async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    mockMessagesList.mockResolvedValue(makeMessageListResponse(ids));
    mockMessagesGet.mockImplementation((params: { id: string }) =>
      Promise.resolve(makeMessageGetResponse(params.id)),
    );

    const adapter = new GmailPromotionsAdapter();
    await adapter.scanPromotions('test-token');

    expect(mockMessagesGet).toHaveBeenCalledTimes(150);
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    mockMessagesList.mockResolvedValue(makeMessageListResponse(['id-1']));

    const error429 = Object.assign(new Error('Rate limited'), { code: 429 });
    mockMessagesGet
      .mockImplementationOnce(() => Promise.reject(error429))
      .mockResolvedValueOnce(makeMessageGetResponse('id-1'));

    const noopDelay = () => Promise.resolve();
    const adapter = new GmailPromotionsAdapter(noopDelay);
    const result = await adapter.scanPromotions('test-token');

    expect(mockMessagesGet).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });

  it('exhausts retries and throws after 3 attempts', async () => {
    mockMessagesList.mockResolvedValue(makeMessageListResponse(['id-1']));

    const error429 = Object.assign(new Error('Rate limited'), { code: 429 });
    mockMessagesGet
      .mockImplementationOnce(() => Promise.reject(error429))
      .mockImplementationOnce(() => Promise.reject(error429))
      .mockImplementationOnce(() => Promise.reject(error429));

    const noopDelay = () => Promise.resolve();
    const adapter = new GmailPromotionsAdapter(noopDelay);

    await expect(adapter.scanPromotions('test-token')).rejects.toThrow(
      'Rate limited',
    );
    expect(mockMessagesGet).toHaveBeenCalledTimes(3);
  });

  it('sets OAuth2 credentials with access token', async () => {
    mockMessagesList.mockResolvedValue(makeMessageListResponse([]));

    const adapter = new GmailPromotionsAdapter();
    await adapter.scanPromotions('my-access-token');

    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: 'my-access-token',
    });
  });

  it('returns EmailMetadata instances', async () => {
    mockMessagesList.mockResolvedValue(makeMessageListResponse(['id-1']));
    mockMessagesGet.mockResolvedValue(makeMessageGetResponse('id-1'));

    const adapter = new GmailPromotionsAdapter();
    const result = await adapter.scanPromotions('test-token');

    expect(result[0]).toBeInstanceOf(EmailMetadata);
  });

  it('returns empty array when messages.list returns no messages', async () => {
    mockMessagesList.mockResolvedValue({ data: {} });

    const adapter = new GmailPromotionsAdapter();
    const result = await adapter.scanPromotions('test-token');

    expect(result).toEqual([]);
    expect(mockMessagesGet).not.toHaveBeenCalled();
  });
});
