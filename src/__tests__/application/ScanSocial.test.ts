import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanSocial } from '@/application/use-cases/ScanSocial';
import type { SocialScanner } from '@/domain/repositories/SocialScanner';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

const makeEmail = (
  id: string,
  sender: string,
  subject: string,
  date: Date,
  sizeEstimate: number,
): EmailMetadata =>
  EmailMetadata.create(id, sender, subject, date, sizeEstimate);

const mockScanner: SocialScanner = {
  scanSocial: vi.fn(),
};

describe('ScanSocial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns emails array with all fields correctly mapped (happy path — 3 emails)', async () => {
    const date1 = new Date('2024-01-10T08:00:00.000Z');
    const date2 = new Date('2024-02-15T12:30:00.000Z');
    const date3 = new Date('2024-03-20T17:45:00.000Z');

    vi.mocked(mockScanner.scanSocial).mockResolvedValue([
      makeEmail('id-1', 'twitter@twitter.com', 'New follower', date1, 200000),
      makeEmail(
        'id-2',
        'linkedin@linkedin.com',
        'Connection request',
        date2,
        150000,
      ),
      makeEmail(
        'id-3',
        'facebook@facebook.com',
        'Friend request',
        date3,
        300000,
      ),
    ]);

    const useCase = new ScanSocial(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toHaveLength(3);
    expect(output.emails[0]).toEqual({
      id: 'id-1',
      sender: 'twitter@twitter.com',
      subject: 'New follower',
      date: date1.toISOString(),
      sizeEstimate: 200000,
    });
    expect(output.emails[1]).toEqual({
      id: 'id-2',
      sender: 'linkedin@linkedin.com',
      subject: 'Connection request',
      date: date2.toISOString(),
      sizeEstimate: 150000,
    });
    expect(output.emails[2]).toEqual({
      id: 'id-3',
      sender: 'facebook@facebook.com',
      subject: 'Friend request',
      date: date3.toISOString(),
      sizeEstimate: 300000,
    });
  });

  it('returns empty emails array when scanner returns no emails', async () => {
    vi.mocked(mockScanner.scanSocial).mockResolvedValue([]);

    const useCase = new ScanSocial(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toEqual([]);
  });

  it('returns array of length 1 with correct fields for single email', async () => {
    const date = new Date('2024-06-01T09:00:00.000Z');

    vi.mocked(mockScanner.scanSocial).mockResolvedValue([
      makeEmail('single-id', 'social@example.com', 'One social', date, 100000),
    ]);

    const useCase = new ScanSocial(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toHaveLength(1);
    expect(output.emails[0]!.id).toBe('single-id');
  });

  it('passes access token to scanner.scanSocial', async () => {
    vi.mocked(mockScanner.scanSocial).mockResolvedValue([]);

    const useCase = new ScanSocial(mockScanner);
    await useCase.execute('my-access-token');

    expect(mockScanner.scanSocial).toHaveBeenCalledWith('my-access-token');
  });

  it('propagates error when scanner rejects', async () => {
    vi.mocked(mockScanner.scanSocial).mockRejectedValue(
      new Error('Scanner failed'),
    );

    const useCase = new ScanSocial(mockScanner);

    await expect(useCase.execute('test-token')).rejects.toThrow(
      'Scanner failed',
    );
  });

  it('serializes date field to ISO 8601 string', async () => {
    const date = new Date('2024-07-04T14:30:00.000Z');

    vi.mocked(mockScanner.scanSocial).mockResolvedValue([
      makeEmail('date-test', 'social@example.com', 'Date test', date, 100000),
    ]);

    const useCase = new ScanSocial(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails[0]!.date).toBe('2024-07-04T14:30:00.000Z');
  });

  it('maps empty subject as empty string in DTO', async () => {
    const date = new Date('2024-08-01T00:00:00.000Z');

    vi.mocked(mockScanner.scanSocial).mockResolvedValue([
      makeEmail('no-subject', 'social@example.com', '', date, 100000),
    ]);

    const useCase = new ScanSocial(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails[0]!.subject).toBe('');
  });
});
