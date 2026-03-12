import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanOldEmails } from '@/application/use-cases/ScanOldEmails';
import type { OldEmailsScanner } from '@/domain/repositories/OldEmailsScanner';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';
import type { AgeThreshold } from '@/domain/value-objects/AgeThreshold';

const makeEmail = (
  id: string,
  sender: string,
  subject: string,
  date: Date,
  sizeEstimate: number,
): EmailMetadata =>
  EmailMetadata.create(id, sender, subject, date, sizeEstimate);

const mockScanner: OldEmailsScanner = {
  scanOldEmails: vi.fn(),
};

describe('ScanOldEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns emails array with all fields correctly mapped (happy path — 3 emails)', async () => {
    const date1 = new Date('2020-01-10T08:00:00.000Z');
    const date2 = new Date('2019-02-15T12:30:00.000Z');
    const date3 = new Date('2018-03-20T17:45:00.000Z');

    vi.mocked(mockScanner.scanOldEmails).mockResolvedValue([
      makeEmail('id-1', 'sender1@example.com', 'Old email 1', date1, 500000),
      makeEmail('id-2', 'sender2@example.com', 'Old email 2', date2, 300000),
      makeEmail('id-3', 'sender3@example.com', 'Old email 3', date3, 200000),
    ]);

    const useCase = new ScanOldEmails(mockScanner);
    const output = await useCase.execute({
      accessToken: 'test-token',
      olderThan: '1y',
    });

    expect(output.emails).toHaveLength(3);
    expect(output.emails[0]).toEqual({
      id: 'id-1',
      sender: 'sender1@example.com',
      subject: 'Old email 1',
      date: date1.toISOString(),
      sizeEstimate: 500000,
    });
    expect(output.emails[1]).toEqual({
      id: 'id-2',
      sender: 'sender2@example.com',
      subject: 'Old email 2',
      date: date2.toISOString(),
      sizeEstimate: 300000,
    });
    expect(output.emails[2]).toEqual({
      id: 'id-3',
      sender: 'sender3@example.com',
      subject: 'Old email 3',
      date: date3.toISOString(),
      sizeEstimate: 200000,
    });
  });

  it('returns empty emails array when scanner returns no emails', async () => {
    vi.mocked(mockScanner.scanOldEmails).mockResolvedValue([]);

    const useCase = new ScanOldEmails(mockScanner);
    const output = await useCase.execute({
      accessToken: 'test-token',
      olderThan: '1y',
    });

    expect(output.emails).toEqual([]);
  });

  it('passes access token to scanner', async () => {
    vi.mocked(mockScanner.scanOldEmails).mockResolvedValue([]);

    const useCase = new ScanOldEmails(mockScanner);
    await useCase.execute({ accessToken: 'my-access-token', olderThan: '1y' });

    expect(mockScanner.scanOldEmails).toHaveBeenCalledWith(
      'my-access-token',
      expect.anything(),
    );
  });

  it.each<AgeThreshold>(['1y', '6m', '2y', '5y'])(
    'passes olderThan parameter "%s" to scanner',
    async (olderThan) => {
      vi.mocked(mockScanner.scanOldEmails).mockResolvedValue([]);

      const useCase = new ScanOldEmails(mockScanner);
      await useCase.execute({ accessToken: 'test-token', olderThan });

      expect(mockScanner.scanOldEmails).toHaveBeenCalledWith(
        'test-token',
        olderThan,
      );
    },
  );

  it('propagates error when scanner rejects', async () => {
    vi.mocked(mockScanner.scanOldEmails).mockRejectedValue(
      new Error('Scanner failed'),
    );

    const useCase = new ScanOldEmails(mockScanner);

    await expect(
      useCase.execute({ accessToken: 'test-token', olderThan: '1y' }),
    ).rejects.toThrow('Scanner failed');
  });

  it('serializes date field to ISO 8601 string', async () => {
    const date = new Date('2019-07-04T14:30:00.000Z');

    vi.mocked(mockScanner.scanOldEmails).mockResolvedValue([
      makeEmail('date-test', 'sender@example.com', 'Date test', date, 100000),
    ]);

    const useCase = new ScanOldEmails(mockScanner);
    const output = await useCase.execute({
      accessToken: 'test-token',
      olderThan: '5y',
    });

    expect(output.emails[0]!.date).toBe('2019-07-04T14:30:00.000Z');
  });

  it('maps empty subject as empty string in DTO', async () => {
    const date = new Date('2019-08-01T00:00:00.000Z');

    vi.mocked(mockScanner.scanOldEmails).mockResolvedValue([
      makeEmail('no-subject', 'sender@example.com', '', date, 100000),
    ]);

    const useCase = new ScanOldEmails(mockScanner);
    const output = await useCase.execute({
      accessToken: 'test-token',
      olderThan: '2y',
    });

    expect(output.emails[0]!.subject).toBe('');
  });
});
