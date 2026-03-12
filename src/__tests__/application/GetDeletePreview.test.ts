import { describe, expect, it } from 'vitest';
import { GetDeletePreview } from '@/application/use-cases/GetDeletePreview';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

function makeEmail(
  id: string,
  sender: string,
  sizeEstimate: number,
): EmailMetadataDto {
  return {
    id,
    sender,
    subject: 'Subject',
    date: '2024-01-01T00:00:00.000Z',
    sizeEstimate,
  };
}

describe('GetDeletePreview', () => {
  it('returns zero summary and empty senders when nothing is selected', () => {
    const useCase = new GetDeletePreview();
    const output = useCase.execute({
      selectedIds: new Set(),
      emails: [
        makeEmail('e1', 'alice@example.com', 1_000_000),
        makeEmail('e2', 'bob@example.com', 2_000_000),
      ],
    });

    expect(output.selectedCount).toBe(0);
    expect(output.totalSizeBytes).toBe(0);
    expect(output.affectedSenders).toEqual([]);
  });

  it('returns selected count and total size for selected IDs', () => {
    const useCase = new GetDeletePreview();
    const output = useCase.execute({
      selectedIds: new Set(['e1', 'e3']),
      emails: [
        makeEmail('e1', 'alice@example.com', 5_000_000),
        makeEmail('e2', 'bob@example.com', 2_000_000),
        makeEmail('e3', 'carol@example.com', 1_000_000),
      ],
    });

    expect(output.selectedCount).toBe(2);
    expect(output.totalSizeBytes).toBe(6_000_000);
    expect(output.affectedSenders).toEqual([
      'alice@example.com',
      'carol@example.com',
    ]);
  });

  it('deduplicates affected senders', () => {
    const useCase = new GetDeletePreview();
    const output = useCase.execute({
      selectedIds: new Set(['e1', 'e2', 'e3']),
      emails: [
        makeEmail('e1', 'alice@example.com', 2_000_000),
        makeEmail('e2', 'alice@example.com', 3_000_000),
        makeEmail('e3', 'bob@example.com', 1_000_000),
      ],
    });

    expect(output.affectedSenders).toEqual([
      'alice@example.com',
      'bob@example.com',
    ]);
  });

  it('ignores selected IDs that do not exist in emails', () => {
    const useCase = new GetDeletePreview();
    const output = useCase.execute({
      selectedIds: new Set(['ghost-id', 'e2']),
      emails: [
        makeEmail('e1', 'alice@example.com', 2_000_000),
        makeEmail('e2', 'bob@example.com', 4_000_000),
      ],
    });

    expect(output.selectedCount).toBe(1);
    expect(output.totalSizeBytes).toBe(4_000_000);
    expect(output.affectedSenders).toEqual(['bob@example.com']);
  });

  it('returns empty values when emails input is empty', () => {
    const useCase = new GetDeletePreview();
    const output = useCase.execute({
      selectedIds: new Set(['e1']),
      emails: [],
    });

    expect(output.selectedCount).toBe(0);
    expect(output.totalSizeBytes).toBe(0);
    expect(output.affectedSenders).toEqual([]);
  });
});
