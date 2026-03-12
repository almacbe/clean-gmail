import { describe, it, expect } from 'vitest';
import { GetSelectionSummary } from '@/application/use-cases/GetSelectionSummary';
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

describe('GetSelectionSummary', () => {
  it('selected IDs that match emails → correct count and sum', () => {
    const useCase = new GetSelectionSummary();
    const output = useCase.execute({
      selectedIds: new Set(['e1', 'e3']),
      emails: [
        makeEmail('e1', 1_000_000),
        makeEmail('e2', 2_000_000),
        makeEmail('e3', 3_000_000),
      ],
    });

    expect(output.selectedCount).toBe(2);
    expect(output.totalSizeBytes).toBe(4_000_000);
  });

  it('all emails selected → count equals length and sum equals total', () => {
    const useCase = new GetSelectionSummary();
    const emails = [
      makeEmail('e1', 1_000_000),
      makeEmail('e2', 2_000_000),
      makeEmail('e3', 3_000_000),
    ];
    const output = useCase.execute({
      selectedIds: new Set(['e1', 'e2', 'e3']),
      emails,
    });

    expect(output.selectedCount).toBe(3);
    expect(output.totalSizeBytes).toBe(6_000_000);
  });

  it('empty selected set → count 0 and totalSizeBytes 0', () => {
    const useCase = new GetSelectionSummary();
    const output = useCase.execute({
      selectedIds: new Set(),
      emails: [makeEmail('e1', 1_000_000), makeEmail('e2', 2_000_000)],
    });

    expect(output.selectedCount).toBe(0);
    expect(output.totalSizeBytes).toBe(0);
  });

  it('selectedIds contains IDs not in emails → only matching emails counted', () => {
    const useCase = new GetSelectionSummary();
    const output = useCase.execute({
      selectedIds: new Set(['e1', 'ghost-id']),
      emails: [makeEmail('e1', 5_000_000), makeEmail('e2', 1_000_000)],
    });

    expect(output.selectedCount).toBe(1);
    expect(output.totalSizeBytes).toBe(5_000_000);
  });

  it('empty emails list → count 0 and totalSizeBytes 0', () => {
    const useCase = new GetSelectionSummary();
    const output = useCase.execute({
      selectedIds: new Set(['e1']),
      emails: [],
    });

    expect(output.selectedCount).toBe(0);
    expect(output.totalSizeBytes).toBe(0);
  });

  it('single email selected → count 1 and totalSizeBytes equals that email size', () => {
    const useCase = new GetSelectionSummary();
    const output = useCase.execute({
      selectedIds: new Set(['e2']),
      emails: [makeEmail('e1', 1_000_000), makeEmail('e2', 7_000_000)],
    });

    expect(output.selectedCount).toBe(1);
    expect(output.totalSizeBytes).toBe(7_000_000);
  });

  it('emails with zero sizeEstimate → totalSizeBytes remains 0', () => {
    const useCase = new GetSelectionSummary();
    const output = useCase.execute({
      selectedIds: new Set(['e1', 'e2']),
      emails: [makeEmail('e1', 0), makeEmail('e2', 0)],
    });

    expect(output.selectedCount).toBe(2);
    expect(output.totalSizeBytes).toBe(0);
  });
});
