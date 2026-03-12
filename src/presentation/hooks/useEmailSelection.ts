'use client';

import { useState, useMemo, useCallback } from 'react';
import { GetSelectionSummary } from '@/application/use-cases/GetSelectionSummary';
import type { GetSelectionSummaryOutput } from '@/application/dtos/GetSelectionSummaryOutput';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

export type EmailSelectionResult = {
  selectedIds: ReadonlySet<string>;
  selectionSummary: GetSelectionSummaryOutput;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  selectBySender: (sender: string, scope: readonly EmailMetadataDto[]) => void;
  clearSelection: () => void;
};

const getSelectionSummary = new GetSelectionSummary();

export function useEmailSelection(
  allEmails: readonly EmailMetadataDto[],
): EmailSelectionResult {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }, []);

  const selectBySender = useCallback(
    (sender: string, scope: readonly EmailMetadataDto[]) => {
      const senderIds = scope
        .filter((e) => e.sender === sender)
        .map((e) => e.id);
      selectAll(senderIds);
    },
    [selectAll],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const selectionSummary = useMemo(
    () => getSelectionSummary.execute({ selectedIds, emails: allEmails }),
    [selectedIds, allEmails],
  );

  return {
    selectedIds,
    selectionSummary,
    isSelected,
    toggle,
    selectAll,
    selectBySender,
    clearSelection,
  };
}
