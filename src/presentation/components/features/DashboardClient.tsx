'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AgeThreshold } from '@/application/dtos/ScanOldEmailsInput';
import { EmailCategoryTabs } from '@/presentation/components/features/EmailCategoryTabs';
import { ScanSummaryCards } from '@/presentation/components/features/ScanSummaryCards';
import type { TabId } from '@/presentation/components/features/EmailCategoryTabs';
import { useLargeEmailsScan } from '@/presentation/hooks/useLargeEmailsScan';
import { usePromotionsScan } from '@/presentation/hooks/usePromotionsScan';
import { useSocialScan } from '@/presentation/hooks/useSocialScan';
import { useSummary } from '@/presentation/hooks/useSummary';
import { clearAllScanCache } from '@/shared/utils/scanCache';

const DEFAULT_SUMMARY_THRESHOLD: AgeThreshold = '1y';

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>('large-emails');
  const [refreshKey, setRefreshKey] = useState(0);

  const largeEmailsResult = useLargeEmailsScan(refreshKey);
  const promotionsResult = usePromotionsScan(refreshKey);
  const socialResult = useSocialScan(refreshKey);
  const summaryResult = useSummary(DEFAULT_SUMMARY_THRESHOLD, refreshKey);

  const isLoading =
    largeEmailsResult.status === 'loading' ||
    promotionsResult.status === 'loading' ||
    socialResult.status === 'loading' ||
    summaryResult.status === 'loading';

  function handleRescan() {
    clearAllScanCache();
    setRefreshKey((k) => k + 1);
  }

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
      />
    </>
  );
}
