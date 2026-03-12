'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { AgeThreshold } from '@/application/dtos/ScanOldEmailsInput';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import { GetDeletePreview } from '@/application/use-cases/GetDeletePreview';
import { EmailCategoryTabs } from '@/presentation/components/features/EmailCategoryTabs';
import { ScanSummaryCards } from '@/presentation/components/features/ScanSummaryCards';
import { SelectionBar } from '@/presentation/components/features/SelectionBar';
import { DeletePreviewModal } from '@/presentation/components/features/DeletePreviewModal';
import type { TabId } from '@/presentation/components/features/EmailCategoryTabs';
import { useLargeEmailsScan } from '@/presentation/hooks/useLargeEmailsScan';
import { usePromotionsScan } from '@/presentation/hooks/usePromotionsScan';
import { useSocialScan } from '@/presentation/hooks/useSocialScan';
import { useSummary } from '@/presentation/hooks/useSummary';
import { useEmailSelection } from '@/presentation/hooks/useEmailSelection';
import { clearAllScanCache } from '@/shared/utils/scanCache';

const DEFAULT_SUMMARY_THRESHOLD: AgeThreshold = '1y';
const getDeletePreview = new GetDeletePreview();

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>('large-emails');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeletePreviewOpen, setIsDeletePreviewOpen] = useState(false);
  const [oldEmailsForSelection, setOldEmailsForSelection] = useState<
    EmailMetadataDto[]
  >([]);

  const largeEmailsResult = useLargeEmailsScan(refreshKey);
  const promotionsResult = usePromotionsScan(refreshKey);
  const socialResult = useSocialScan(refreshKey);
  const summaryResult = useSummary(DEFAULT_SUMMARY_THRESHOLD, refreshKey);

  const allEmails = useMemo(() => {
    const emails: EmailMetadataDto[] = [];
    if (largeEmailsResult.status === 'success')
      emails.push(...largeEmailsResult.data.emails);
    if (promotionsResult.status === 'success')
      emails.push(...promotionsResult.data.emails);
    if (socialResult.status === 'success')
      emails.push(...socialResult.data.emails);
    emails.push(...oldEmailsForSelection);
    return emails;
  }, [
    largeEmailsResult,
    promotionsResult,
    socialResult,
    oldEmailsForSelection,
  ]);

  const {
    selectedIds,
    selectionSummary,
    toggle,
    selectAll,
    selectBySender,
    clearSelection,
  } = useEmailSelection(allEmails);

  const deletePreview = useMemo(
    () => getDeletePreview.execute({ selectedIds, emails: allEmails }),
    [selectedIds, allEmails],
  );

  const isLoading =
    largeEmailsResult.status === 'loading' ||
    promotionsResult.status === 'loading' ||
    socialResult.status === 'loading' ||
    summaryResult.status === 'loading';

  function handleRescan() {
    clearAllScanCache();
    clearSelection();
    setIsDeletePreviewOpen(false);
    setRefreshKey((k) => k + 1);
  }

  function handleDeleteSelected() {
    setIsDeletePreviewOpen(true);
  }

  function handleCloseDeletePreview() {
    setIsDeletePreviewOpen(false);
  }

  function handleConfirmDeletePreview() {
    setIsDeletePreviewOpen(false);
  }

  const handleOldEmailsChange = useCallback(
    (emails: EmailMetadataDto[]) => setOldEmailsForSelection(emails),
    [],
  );

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Link
          href="/dashboard/top-senders"
          className="btn btn-ghost btn-sm"
          data-testid="top-senders-link"
        >
          Top Senders
        </Link>
        <Link
          href="/dashboard/recommendations"
          className="btn btn-ghost btn-sm"
          data-testid="recommendations-link"
        >
          Recommendations
        </Link>
        <button
          data-testid="rescan-button"
          className="btn btn-primary btn-sm"
          onClick={handleRescan}
          disabled={isLoading}
        >
          {isLoading && <span className="loading loading-spinner loading-xs" />}
          Rescan
        </button>
      </div>
      <ScanSummaryCards summary={summaryResult} onTabSelect={setActiveTab} />
      <EmailCategoryTabs
        largeEmails={largeEmailsResult}
        promotions={promotionsResult}
        social={socialResult}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        refreshKey={refreshKey}
        selectedIds={selectedIds}
        onToggle={toggle}
        onSelectAll={selectAll}
        onSelectBySender={selectBySender}
        onOldEmailsChange={handleOldEmailsChange}
      />
      {selectionSummary.selectedCount > 0 && (
        <SelectionBar
          selectedCount={selectionSummary.selectedCount}
          totalSizeBytes={selectionSummary.totalSizeBytes}
          onClear={clearSelection}
          onDeleteSelected={handleDeleteSelected}
        />
      )}
      <DeletePreviewModal
        isOpen={isDeletePreviewOpen}
        selectedCount={deletePreview.selectedCount}
        totalSizeBytes={deletePreview.totalSizeBytes}
        affectedSenders={deletePreview.affectedSenders}
        onCancel={handleCloseDeletePreview}
        onConfirm={handleConfirmDeletePreview}
      />
    </>
  );
}
