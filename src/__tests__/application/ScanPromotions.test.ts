import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanPromotions } from '@/application/use-cases/ScanPromotions';
import type { PromotionsScanner } from '@/domain/repositories/PromotionsScanner';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

const makeEmail = (
  id: string,
  sender: string,
  subject: string,
  date: Date,
  sizeEstimate: number,
): EmailMetadata =>
  EmailMetadata.create(id, sender, subject, date, sizeEstimate);

const mockScanner: PromotionsScanner = {
  scanPromotions: vi.fn(),
};

describe('ScanPromotions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns emails array with all fields correctly mapped (happy path — 3 emails)', async () => {
    const date1 = new Date('2024-01-10T08:00:00.000Z');
    const date2 = new Date('2024-02-15T12:30:00.000Z');
    const date3 = new Date('2024-03-20T17:45:00.000Z');

    vi.mocked(mockScanner.scanPromotions).mockResolvedValue([
      makeEmail('id-1', 'promo@shop.com', 'Sale today!', date1, 200000),
      makeEmail('id-2', 'news@brand.com', 'Newsletter', date2, 150000),
      makeEmail('id-3', 'deals@store.com', 'Exclusive offer', date3, 300000),
    ]);

    const useCase = new ScanPromotions(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toHaveLength(3);
    expect(output.emails[0]).toEqual({
      id: 'id-1',
      sender: 'promo@shop.com',
      subject: 'Sale today!',
      date: date1.toISOString(),
      sizeEstimate: 200000,
    });
    expect(output.emails[1]).toEqual({
      id: 'id-2',
      sender: 'news@brand.com',
      subject: 'Newsletter',
      date: date2.toISOString(),
      sizeEstimate: 150000,
    });
    expect(output.emails[2]).toEqual({
      id: 'id-3',
      sender: 'deals@store.com',
      subject: 'Exclusive offer',
      date: date3.toISOString(),
      sizeEstimate: 300000,
    });
  });

  it('returns empty emails array when scanner returns no emails', async () => {
    vi.mocked(mockScanner.scanPromotions).mockResolvedValue([]);

    const useCase = new ScanPromotions(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toEqual([]);
  });

  it('returns array of length 1 with correct fields for single email', async () => {
    const date = new Date('2024-06-01T09:00:00.000Z');

    vi.mocked(mockScanner.scanPromotions).mockResolvedValue([
      makeEmail('single-id', 'promo@example.com', 'One promo', date, 100000),
    ]);

    const useCase = new ScanPromotions(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails).toHaveLength(1);
    expect(output.emails[0]!.id).toBe('single-id');
  });

  it('passes access token to scanner.scanPromotions', async () => {
    vi.mocked(mockScanner.scanPromotions).mockResolvedValue([]);

    const useCase = new ScanPromotions(mockScanner);
    await useCase.execute('my-access-token');

    expect(mockScanner.scanPromotions).toHaveBeenCalledWith('my-access-token');
  });

  it('propagates error when scanner rejects', async () => {
    vi.mocked(mockScanner.scanPromotions).mockRejectedValue(
      new Error('Scanner failed'),
    );

    const useCase = new ScanPromotions(mockScanner);

    await expect(useCase.execute('test-token')).rejects.toThrow(
      'Scanner failed',
    );
  });

  it('serializes date field to ISO 8601 string', async () => {
    const date = new Date('2024-07-04T14:30:00.000Z');

    vi.mocked(mockScanner.scanPromotions).mockResolvedValue([
      makeEmail('date-test', 'promo@example.com', 'Date test', date, 100000),
    ]);

    const useCase = new ScanPromotions(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails[0]!.date).toBe('2024-07-04T14:30:00.000Z');
  });

  it('maps empty subject as empty string in DTO', async () => {
    const date = new Date('2024-08-01T00:00:00.000Z');

    vi.mocked(mockScanner.scanPromotions).mockResolvedValue([
      makeEmail('no-subject', 'promo@example.com', '', date, 100000),
    ]);

    const useCase = new ScanPromotions(mockScanner);
    const output = await useCase.execute('test-token');

    expect(output.emails[0]!.subject).toBe('');
  });
});
