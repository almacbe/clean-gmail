// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailSelection } from '@/presentation/hooks/useEmailSelection';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

function makeEmail(id: string, sizeEstimate = 1_000_000): EmailMetadataDto {
  return {
    id,
    sender: `${id}@example.com`,
    subject: 'Subject',
    date: '2024-01-01T00:00:00.000Z',
    sizeEstimate,
  };
}

const EMAILS: EmailMetadataDto[] = [
  makeEmail('e1', 1_000_000),
  makeEmail('e2', 2_000_000),
  makeEmail('e3', 3_000_000),
];

describe('useEmailSelection', () => {
  it('initial state: no IDs selected, summary is zero', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectionSummary.selectedCount).toBe(0);
    expect(result.current.selectionSummary.totalSizeBytes).toBe(0);
  });

  it('toggle adds an ID', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    act(() => result.current.toggle('e1'));

    expect(result.current.isSelected('e1')).toBe(true);
    expect(result.current.selectionSummary.selectedCount).toBe(1);
    expect(result.current.selectionSummary.totalSizeBytes).toBe(1_000_000);
  });

  it('toggle removes an already-selected ID', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    act(() => result.current.toggle('e2'));
    act(() => result.current.toggle('e2'));

    expect(result.current.isSelected('e2')).toBe(false);
    expect(result.current.selectionSummary.selectedCount).toBe(0);
  });

  it('selectAll selects all given IDs', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    act(() => result.current.selectAll(['e1', 'e2', 'e3']));

    expect(result.current.selectedIds.size).toBe(3);
    expect(result.current.selectionSummary.selectedCount).toBe(3);
  });

  it('selectAll deselects all when all are already selected (toggle semantics)', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    act(() => result.current.selectAll(['e1', 'e2']));
    act(() => result.current.selectAll(['e1', 'e2']));

    expect(result.current.selectedIds.size).toBe(0);
  });

  it('selectAll selects remaining when only some are selected', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    act(() => result.current.toggle('e1'));
    act(() => result.current.selectAll(['e1', 'e2']));

    expect(result.current.isSelected('e1')).toBe(true);
    expect(result.current.isSelected('e2')).toBe(true);
  });

  it('selectBySender selects all emails from the given sender in scope', () => {
    const emails: EmailMetadataDto[] = [
      { ...makeEmail('e1'), sender: 'alice@example.com' },
      { ...makeEmail('e2'), sender: 'bob@example.com' },
      { ...makeEmail('e3'), sender: 'alice@example.com' },
    ];
    const { result } = renderHook(() => useEmailSelection(emails));

    act(() => result.current.selectBySender('alice@example.com', emails));

    expect(result.current.isSelected('e1')).toBe(true);
    expect(result.current.isSelected('e2')).toBe(false);
    expect(result.current.isSelected('e3')).toBe(true);
  });

  it('selectBySender deselects sender emails when all already selected', () => {
    const emails: EmailMetadataDto[] = [
      { ...makeEmail('e1'), sender: 'alice@example.com' },
      { ...makeEmail('e2'), sender: 'alice@example.com' },
    ];
    const { result } = renderHook(() => useEmailSelection(emails));

    act(() => result.current.selectBySender('alice@example.com', emails));
    act(() => result.current.selectBySender('alice@example.com', emails));

    expect(result.current.isSelected('e1')).toBe(false);
    expect(result.current.isSelected('e2')).toBe(false);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useEmailSelection(EMAILS));

    act(() => result.current.selectAll(['e1', 'e2', 'e3']));
    act(() => result.current.clearSelection());

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectionSummary.selectedCount).toBe(0);
    expect(result.current.selectionSummary.totalSizeBytes).toBe(0);
  });
});
