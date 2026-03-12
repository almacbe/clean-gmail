import { describe, it, expect } from 'vitest';
import { GetTopSenders } from '@/application/use-cases/GetTopSenders';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

function makeEmail(
  id: string,
  sender: string,
  sizeEstimate: number,
): EmailMetadataDto {
  return {
    id,
    sender,
    subject: 'Test subject',
    date: '2024-01-01T00:00:00.000Z',
    sizeEstimate,
  };
}

describe('GetTopSenders', () => {
  it('multiple senders → correct ranking by size descending', () => {
    const useCase = new GetTopSenders();
    const output = useCase.execute({
      emails: [
        makeEmail('1', 'small@example.com', 1_000),
        makeEmail('2', 'large@example.com', 10_000_000),
        makeEmail('3', 'medium@example.com', 5_000_000),
      ],
    });

    expect(output.senders[0]!.sender).toBe('large@example.com');
    expect(output.senders[1]!.sender).toBe('medium@example.com');
    expect(output.senders[2]!.sender).toBe('small@example.com');
  });

  it('25 distinct senders → only top 20 returned', () => {
    const emails: EmailMetadataDto[] = Array.from({ length: 25 }, (_, i) =>
      makeEmail(`id-${i}`, `sender${i}@example.com`, (i + 1) * 1_000),
    );

    const useCase = new GetTopSenders();
    const output = useCase.execute({ emails });

    expect(output.senders).toHaveLength(20);
  });

  it('exactly 20 senders → all 20 returned', () => {
    const emails: EmailMetadataDto[] = Array.from({ length: 20 }, (_, i) =>
      makeEmail(`id-${i}`, `sender${i}@example.com`, (i + 1) * 1_000),
    );

    const useCase = new GetTopSenders();
    const output = useCase.execute({ emails });

    expect(output.senders).toHaveLength(20);
  });

  it('fewer than 20 senders → all returned', () => {
    const emails: EmailMetadataDto[] = Array.from({ length: 5 }, (_, i) =>
      makeEmail(`id-${i}`, `sender${i}@example.com`, (i + 1) * 1_000),
    );

    const useCase = new GetTopSenders();
    const output = useCase.execute({ emails });

    expect(output.senders).toHaveLength(5);
  });

  it('empty input → empty output', () => {
    const useCase = new GetTopSenders();
    const output = useCase.execute({ emails: [] });

    expect(output.senders).toHaveLength(0);
  });

  it('single email → single sender entry', () => {
    const useCase = new GetTopSenders();
    const output = useCase.execute({
      emails: [makeEmail('id-1', 'only@example.com', 5_000_000)],
    });

    expect(output.senders).toHaveLength(1);
    expect(output.senders[0]).toEqual({
      sender: 'only@example.com',
      emailCount: 1,
      totalSizeBytes: 5_000_000,
    });
  });

  it('same sender on multiple emails → aggregated correctly', () => {
    const useCase = new GetTopSenders();
    const output = useCase.execute({
      emails: [
        makeEmail('id-1', 'repeat@example.com', 3_000_000),
        makeEmail('id-2', 'repeat@example.com', 2_000_000),
        makeEmail('id-3', 'repeat@example.com', 1_000_000),
      ],
    });

    expect(output.senders).toHaveLength(1);
    expect(output.senders[0]).toEqual({
      sender: 'repeat@example.com',
      emailCount: 3,
      totalSizeBytes: 6_000_000,
    });
  });

  it('sender string preserved exactly (no trimming)', () => {
    const senderWithSpaces = '  Alice <alice@example.com>  ';
    const useCase = new GetTopSenders();
    const output = useCase.execute({
      emails: [makeEmail('id-1', senderWithSpaces, 1_000)],
    });

    expect(output.senders[0]!.sender).toBe(senderWithSpaces);
  });

  it('ties in totalSizeBytes → both appear in output', () => {
    const useCase = new GetTopSenders();
    const output = useCase.execute({
      emails: [
        makeEmail('id-1', 'alice@example.com', 5_000_000),
        makeEmail('id-2', 'bob@example.com', 5_000_000),
      ],
    });

    expect(output.senders).toHaveLength(2);
    const senderNames = output.senders.map((s) => s.sender);
    expect(senderNames).toContain('alice@example.com');
    expect(senderNames).toContain('bob@example.com');
  });
});
