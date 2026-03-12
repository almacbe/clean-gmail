import { describe, it, expect } from 'vitest';
import { GetRecommendations } from '@/application/use-cases/GetRecommendations';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

function makeEmail(id: string, sizeEstimate: number): EmailMetadataDto {
  return {
    id,
    sender: 'sender@example.com',
    subject: 'Test subject',
    date: '2024-01-01T00:00:00.000Z',
    sizeEstimate,
  };
}

describe('GetRecommendations', () => {
  it('all four categories with data → four recommendations sorted by size descending', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 5_000_000)],
      promotions: [makeEmail('p1', 10_000_000), makeEmail('p2', 2_000_000)],
      social: [makeEmail('s1', 1_000_000)],
      oldEmails: [makeEmail('o1', 8_000_000)],
    });

    expect(output.recommendations).toHaveLength(4);
    expect(output.recommendations[0]!.category).toBe('Promotions');
    expect(output.recommendations[0]!.totalSizeBytes).toBe(12_000_000);
    expect(output.recommendations[1]!.category).toBe('Old Emails');
    expect(output.recommendations[2]!.category).toBe('Large Emails');
    expect(output.recommendations[3]!.category).toBe('Social');
  });

  it('empty categories are excluded from output', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 5_000_000)],
      promotions: [],
      social: [],
      oldEmails: [makeEmail('o1', 8_000_000)],
    });

    expect(output.recommendations).toHaveLength(2);
    const categories = output.recommendations.map((r) => r.category);
    expect(categories).toContain('Large Emails');
    expect(categories).toContain('Old Emails');
    expect(categories).not.toContain('Promotions');
    expect(categories).not.toContain('Social');
  });

  it('all categories empty → empty recommendations array', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [],
      promotions: [],
      social: [],
      oldEmails: [],
    });

    expect(output.recommendations).toHaveLength(0);
  });

  it('single category with data → one recommendation', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 3_000_000)],
      promotions: [],
      social: [],
      oldEmails: [],
    });

    expect(output.recommendations).toHaveLength(1);
    expect(output.recommendations[0]!.category).toBe('Large Emails');
    expect(output.recommendations[0]!.emailCount).toBe(1);
    expect(output.recommendations[0]!.totalSizeBytes).toBe(3_000_000);
  });

  it('ties in totalSizeBytes → both appear in output', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 5_000_000)],
      promotions: [makeEmail('p1', 5_000_000)],
      social: [],
      oldEmails: [],
    });

    expect(output.recommendations).toHaveLength(2);
    const categories = output.recommendations.map((r) => r.category);
    expect(categories).toContain('Large Emails');
    expect(categories).toContain('Promotions');
  });

  it('first item has the largest totalSizeBytes', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 1_000_000)],
      promotions: [makeEmail('p1', 20_000_000)],
      social: [makeEmail('s1', 5_000_000)],
      oldEmails: [],
    });

    expect(output.recommendations[0]!.totalSizeBytes).toBeGreaterThanOrEqual(
      output.recommendations[1]!.totalSizeBytes,
    );
    expect(output.recommendations[1]!.totalSizeBytes).toBeGreaterThanOrEqual(
      output.recommendations[2]!.totalSizeBytes,
    );
  });

  it('single email per category → emailCount is 1 per category', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 1_000_000)],
      promotions: [makeEmail('p1', 2_000_000)],
      social: [makeEmail('s1', 3_000_000)],
      oldEmails: [makeEmail('o1', 4_000_000)],
    });

    for (const rec of output.recommendations) {
      expect(rec.emailCount).toBe(1);
    }
  });

  it('category labels are correct for each input key', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [makeEmail('l1', 1_000_000)],
      promotions: [makeEmail('p1', 1_000_000)],
      social: [makeEmail('s1', 1_000_000)],
      oldEmails: [makeEmail('o1', 1_000_000)],
    });

    const categories = output.recommendations.map((r) => r.category);
    expect(categories).toContain('Large Emails');
    expect(categories).toContain('Promotions');
    expect(categories).toContain('Social');
    expect(categories).toContain('Old Emails');
  });

  it('multiple emails per category → emailCount and totalSizeBytes summed correctly', () => {
    const useCase = new GetRecommendations();
    const output = useCase.execute({
      largeEmails: [],
      promotions: [
        makeEmail('p1', 3_000_000),
        makeEmail('p2', 4_000_000),
        makeEmail('p3', 1_000_000),
      ],
      social: [],
      oldEmails: [],
    });

    expect(output.recommendations[0]!.emailCount).toBe(3);
    expect(output.recommendations[0]!.totalSizeBytes).toBe(8_000_000);
  });
});
