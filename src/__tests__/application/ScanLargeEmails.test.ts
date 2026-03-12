import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanLargeEmails } from '@/application/use-cases/ScanLargeEmails';
import type { LargeEmailScanner } from '@/domain/repositories/LargeEmailScanner';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

const makeEmail = (
  id: string,
  sender: string,
  subject: string,
  date: Date,
  sizeEstimate: number,
): EmailMetadata =>
  EmailMetadata.create(id, sender, subject, date, sizeEstimate);

const mockScanner: LargeEmailScanner = {
  scanLargeEmails: vi.fn(),
};

describe('ScanLargeEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns emails array with all fields correctly mapped (happy path — 3 emails)', async () => {
    const date1 = new Date('2024-01-10T08:00:00.000Z');
    const date2 = new Date('2024-02-15T12:30:00.000Z');
    const date3 = new Date('2024-03-20T17:45:00.000Z');

    vi.mocked(mockScanner.scanLargeEmails).mockResolvedValue([
      makeEmail(
        'id-1',
        'alice@example.com',
        'Large attachment',
        date1,
        6000000,
      ),
      makeEmail('id-2', 'bob@example.com', 'Another big email', date2, 8500000),
      makeEmail('id-3', 'charlie@example.com', 'Huge file', date3, 12000000),
    ]);

    const useCase = new ScanLargeEmails(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toHaveLength(3);
    expect(output.emails[0]).toEqual({
      id: 'id-1',
      sender: 'alice@example.com',
      subject: 'Large attachment',
      date: date1.toISOString(),
      sizeEstimate: 6000000,
    });
    expect(output.emails[1]).toEqual({
      id: 'id-2',
      sender: 'bob@example.com',
      subject: 'Another big email',
      date: date2.toISOString(),
      sizeEstimate: 8500000,
    });
    expect(output.emails[2]).toEqual({
      id: 'id-3',
      sender: 'charlie@example.com',
      subject: 'Huge file',
      date: date3.toISOString(),
      sizeEstimate: 12000000,
    });
  });

  it('returns empty emails array when scanner returns no emails', async () => {
    vi.mocked(mockScanner.scanLargeEmails).mockResolvedValue([]);

    const useCase = new ScanLargeEmails(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toEqual([]);
  });

  it('returns array of length 1 with correct fields for single email', async () => {
    const date = new Date('2024-06-01T09:00:00.000Z');

    vi.mocked(mockScanner.scanLargeEmails).mockResolvedValue([
      makeEmail('single-id', 'only@example.com', 'One email', date, 7000000),
    ]);

    const useCase = new ScanLargeEmails(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toHaveLength(1);
    expect(output.emails[0]!.id).toBe('single-id');
  });

  it('passes access token to scanner.scanLargeEmails', async () => {
    vi.mocked(mockScanner.scanLargeEmails).mockResolvedValue([]);

    const useCase = new ScanLargeEmails(mockScanner);
    await useCase.execute('my-access-token');

    expect(mockScanner.scanLargeEmails).toHaveBeenCalledWith('my-access-token');
  });

  it('propagates error when scanner rejects', async () => {
    vi.mocked(mockScanner.scanLargeEmails).mockRejectedValue(
      new Error('Scanner failed'),
    );

    const useCase = new ScanLargeEmails(mockScanner);

    await expect(useCase.execute('test-token')).rejects.toThrow(
      'Scanner failed',
    );
  });

  it('serializes date field to ISO 8601 string', async () => {
    const date = new Date('2024-07-04T14:30:00.000Z');

    vi.mocked(mockScanner.scanLargeEmails).mockResolvedValue([
      makeEmail('date-test', 'user@example.com', 'Date test', date, 5000000),
    ]);

    const useCase = new ScanLargeEmails(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails[0]!.date).toBe('2024-07-04T14:30:00.000Z');
  });

  it('maps empty subject as empty string in DTO', async () => {
    const date = new Date('2024-08-01T00:00:00.000Z');

    vi.mocked(mockScanner.scanLargeEmails).mockResolvedValue([
      makeEmail('no-subject', 'user@example.com', '', date, 5000000),
    ]);

    const useCase = new ScanLargeEmails(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails[0]!.subject).toBe('');
  });
});
