import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GmailProfile } from '@/domain/value-objects/GmailProfile';

const { mockGetProfile, mockSetCredentials, mockGmail } = vi.hoisted(() => ({
  mockGetProfile: vi.fn(),
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

import { GmailProfileAdapter } from '@/infrastructure/gmail/GmailProfileAdapter';
import { google } from 'googleapis';

describe('GmailProfileAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGmail.mockReturnValue({
      users: {
        getProfile: mockGetProfile,
      },
    });
  });

  it('returns GmailProfile with correct field mapping on successful API response', async () => {
    mockGetProfile.mockResolvedValue({
      data: {
        emailAddress: 'user@gmail.com',
        messagesTotal: 2500,
        threadsTotal: 1200,
      },
    });

    const adapter = new GmailProfileAdapter();
    const profile = await adapter.getProfile('valid-token');

    expect(profile).toBeInstanceOf(GmailProfile);
    expect(profile.emailAddress).toBe('user@gmail.com');
    expect(profile.messagesTotal).toBe(2500);
    expect(profile.threadsTotal).toBe(1200);
  });

  it('defaults messagesTotal to 0 when API returns null', async () => {
    mockGetProfile.mockResolvedValue({
      data: {
        emailAddress: 'user@gmail.com',
        messagesTotal: null,
        threadsTotal: 500,
      },
    });

    const adapter = new GmailProfileAdapter();
    const profile = await adapter.getProfile('valid-token');

    expect(profile.messagesTotal).toBe(0);
  });

  it('defaults threadsTotal to 0 when API returns null', async () => {
    mockGetProfile.mockResolvedValue({
      data: {
        emailAddress: 'user@gmail.com',
        messagesTotal: 100,
        threadsTotal: null,
      },
    });

    const adapter = new GmailProfileAdapter();
    const profile = await adapter.getProfile('valid-token');

    expect(profile.threadsTotal).toBe(0);
  });

  it('propagates error when API throws', async () => {
    mockGetProfile.mockRejectedValue(new Error('API error'));

    const adapter = new GmailProfileAdapter();

    await expect(adapter.getProfile('valid-token')).rejects.toThrow(
      'API error',
    );
  });

  it('passes userId "me" to the API', async () => {
    mockGetProfile.mockResolvedValue({
      data: {
        emailAddress: 'user@gmail.com',
        messagesTotal: 10,
        threadsTotal: 5,
      },
    });

    const adapter = new GmailProfileAdapter();
    await adapter.getProfile('valid-token');

    expect(mockGetProfile).toHaveBeenCalledWith({ userId: 'me' });
  });

  it('sets the accessToken on the OAuth2 client credentials', async () => {
    mockGetProfile.mockResolvedValue({
      data: {
        emailAddress: 'user@gmail.com',
        messagesTotal: 10,
        threadsTotal: 5,
      },
    });

    const adapter = new GmailProfileAdapter();
    await adapter.getProfile('my-access-token');

    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: 'my-access-token',
    });
  });

  it('creates gmail client with version v1', async () => {
    mockGetProfile.mockResolvedValue({
      data: {
        emailAddress: 'user@gmail.com',
        messagesTotal: 10,
        threadsTotal: 5,
      },
    });

    const adapter = new GmailProfileAdapter();
    await adapter.getProfile('my-access-token');

    expect(google.gmail).toHaveBeenCalledWith(
      expect.objectContaining({ version: 'v1' }),
    );
  });
});
