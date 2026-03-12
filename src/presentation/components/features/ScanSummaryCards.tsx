'use client';

import type { GetScanSummaryOutput } from '@/application/dtos/GetScanSummaryOutput';
import type { TabId } from '@/presentation/components/features/EmailCategoryTabs';
import { formatBytes } from '@/shared/utils/formatBytes';

type ScanSummaryCardsProps = {
  summary: GetScanSummaryOutput | { error: string };
  onTabSelect: (tab: TabId) => void;
};

type CardConfig = {
  label: string;
  tabId: TabId;
  testId: string;
  key: keyof GetScanSummaryOutput;
};

const CARDS: CardConfig[] = [
  {
    label: 'Large Emails',
    tabId: 'large-emails',
    testId: 'summary-card-large-emails',
    key: 'largeEmails',
  },
  {
    label: 'Promotions',
    tabId: 'promotions',
    testId: 'summary-card-promotions',
    key: 'promotions',
  },
  {
    label: 'Social',
    tabId: 'social',
    testId: 'summary-card-social',
    key: 'social',
  },
  {
    label: 'Old Emails',
    tabId: 'old-emails',
    testId: 'summary-card-old-emails',
    key: 'oldEmails',
  },
];

export function ScanSummaryCards({
  summary,
  onTabSelect,
}: ScanSummaryCardsProps) {
  if ('error' in summary) {
    return (
      <div
        role="alert"
        data-testid="summary-error"
        className="alert alert-error mb-4"
      >
        <span>{summary.error}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {CARDS.map(({ label, tabId, testId, key }) => {
        const { count, totalSizeBytes } = summary[key];
        return (
          <button
            key={tabId}
            data-testid={testId}
            onClick={() => onTabSelect(tabId)}
            className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left w-full"
          >
            <div className="card-body p-4">
              <h3 className="card-title text-sm font-medium text-base-content/70">
                {label}
              </h3>
              <p className="text-2xl font-bold">{count.toLocaleString()}</p>
              <p className="text-sm text-base-content/60">
                {formatBytes(totalSizeBytes)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
