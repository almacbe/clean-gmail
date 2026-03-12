import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetScanSummary } from '@/application/use-cases/GetScanSummary';
import type { LargeEmailScanner } from '@/domain/repositories/LargeEmailScanner';
import type { PromotionsScanner } from '@/domain/repositories/PromotionsScanner';
import type { SocialScanner } from '@/domain/repositories/SocialScanner';
import type { OldEmailsScanner } from '@/domain/repositories/OldEmailsScanner';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';

const makeEmail = (id: string, sizeEstimate: number): EmailMetadata =>
  EmailMetadata.create(
    id,
    'sender@example.com',
    'Subject',
    new Date(),
    sizeEstimate,
  );

const mockLargeEmailScanner: LargeEmailScanner = {
  scanLargeEmails: vi.fn(),
};

const mockPromotionsScanner: PromotionsScanner = {
  scanPromotions: vi.fn(),
};

const mockSocialScanner: SocialScanner = {
  scanSocial: vi.fn(),
};

const mockOldEmailsScanner: OldEmailsScanner = {
  scanOldEmails: vi.fn(),
};

function makeUseCase(): GetScanSummary {
  return new GetScanSummary(
    mockLargeEmailScanner,
    mockPromotionsScanner,
    mockSocialScanner,
    mockOldEmailsScanner,
  );
}

describe('GetScanSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path — all scanners return data, verifies count and totalSizeBytes', async () => {
    vi.mocked(mockLargeEmailScanner.scanLargeEmails).mockResolvedValue([
      makeEmail('large-1', 6_000_000),
      makeEmail('large-2', 8_000_000),
    ]);
    vi.mocked(mockPromotionsScanner.scanPromotions).mockResolvedValue([
      makeEmail('promo-1', 200_000),
      makeEmail('promo-2', 150_000),
      makeEmail('promo-3', 100_000),
    ]);
    vi.mocked(mockSocialScanner.scanSocial).mockResolvedValue([
      makeEmail('social-1', 180_000),
    ]);
    vi.mocked(mockOldEmailsScanner.scanOldEmails).mockResolvedValue([
      makeEmail('old-1', 500_000),
      makeEmail('old-2', 300_000),
      makeEmail('old-3', 700_000),
      makeEmail('old-4', 400_000),
    ]);

    const useCase = makeUseCase();
    const output = await useCase.execute({
      accessToken: 'token',
      olderThan: '1y',
    });

    expect(output.largeEmails).toEqual({
      count: 2,
      totalSizeBytes: 14_000_000,
    });
    expect(output.promotions).toEqual({ count: 3, totalSizeBytes: 450_000 });
    expect(output.social).toEqual({ count: 1, totalSizeBytes: 180_000 });
    expect(output.oldEmails).toEqual({ count: 4, totalSizeBytes: 1_900_000 });
  });

  it('empty arrays — all categories return count:0, totalSizeBytes:0', async () => {
    vi.mocked(mockLargeEmailScanner.scanLargeEmails).mockResolvedValue([]);
    vi.mocked(mockPromotionsScanner.scanPromotions).mockResolvedValue([]);
    vi.mocked(mockSocialScanner.scanSocial).mockResolvedValue([]);
    vi.mocked(mockOldEmailsScanner.scanOldEmails).mockResolvedValue([]);

    const useCase = makeUseCase();
    const output = await useCase.execute({
      accessToken: 'token',
      olderThan: '1y',
    });

    expect(output.largeEmails).toEqual({ count: 0, totalSizeBytes: 0 });
    expect(output.promotions).toEqual({ count: 0, totalSizeBytes: 0 });
    expect(output.social).toEqual({ count: 0, totalSizeBytes: 0 });
    expect(output.oldEmails).toEqual({ count: 0, totalSizeBytes: 0 });
  });

  it('one scanner fails — others still correct, failed category returns {count:0, totalSizeBytes:0}', async () => {
    vi.mocked(mockLargeEmailScanner.scanLargeEmails).mockRejectedValue(
      new Error('Large scanner failed'),
    );
    vi.mocked(mockPromotionsScanner.scanPromotions).mockResolvedValue([
      makeEmail('promo-1', 100_000),
    ]);
    vi.mocked(mockSocialScanner.scanSocial).mockResolvedValue([
      makeEmail('social-1', 80_000),
    ]);
    vi.mocked(mockOldEmailsScanner.scanOldEmails).mockResolvedValue([
      makeEmail('old-1', 500_000),
    ]);

    const useCase = makeUseCase();
    const output = await useCase.execute({
      accessToken: 'token',
      olderThan: '2y',
    });

    expect(output.largeEmails).toEqual({ count: 0, totalSizeBytes: 0 });
    expect(output.promotions).toEqual({ count: 1, totalSizeBytes: 100_000 });
    expect(output.social).toEqual({ count: 1, totalSizeBytes: 80_000 });
    expect(output.oldEmails).toEqual({ count: 1, totalSizeBytes: 500_000 });
  });

  it('forwards accessToken to all scanners', async () => {
    vi.mocked(mockLargeEmailScanner.scanLargeEmails).mockResolvedValue([]);
    vi.mocked(mockPromotionsScanner.scanPromotions).mockResolvedValue([]);
    vi.mocked(mockSocialScanner.scanSocial).mockResolvedValue([]);
    vi.mocked(mockOldEmailsScanner.scanOldEmails).mockResolvedValue([]);

    const useCase = makeUseCase();
    await useCase.execute({ accessToken: 'my-secret-token', olderThan: '1y' });

    expect(mockLargeEmailScanner.scanLargeEmails).toHaveBeenCalledWith(
      'my-secret-token',
    );
    expect(mockPromotionsScanner.scanPromotions).toHaveBeenCalledWith(
      'my-secret-token',
    );
    expect(mockSocialScanner.scanSocial).toHaveBeenCalledWith(
      'my-secret-token',
    );
    expect(mockOldEmailsScanner.scanOldEmails).toHaveBeenCalledWith(
      'my-secret-token',
      expect.anything(),
    );
  });

  it('forwards olderThan to old-emails scanner', async () => {
    vi.mocked(mockLargeEmailScanner.scanLargeEmails).mockResolvedValue([]);
    vi.mocked(mockPromotionsScanner.scanPromotions).mockResolvedValue([]);
    vi.mocked(mockSocialScanner.scanSocial).mockResolvedValue([]);
    vi.mocked(mockOldEmailsScanner.scanOldEmails).mockResolvedValue([]);

    const useCase = makeUseCase();
    await useCase.execute({ accessToken: 'token', olderThan: '5y' });

    expect(mockOldEmailsScanner.scanOldEmails).toHaveBeenCalledWith(
      'token',
      '5y',
    );
  });
});
