'use client';

import { useState } from 'react';
import type { GetScanSummaryOutput } from '@/application/dtos/GetScanSummaryOutput';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';
import { EmailCategoryTabs } from '@/presentation/components/features/EmailCategoryTabs';
import { ScanSummaryCards } from '@/presentation/components/features/ScanSummaryCards';
import type { TabId } from '@/presentation/components/features/EmailCategoryTabs';

type ScanResult = (ScanEmailsOutput & { error?: never }) | { error: string };
type SummaryResult =
  | (GetScanSummaryOutput & { error?: never })
  | { error: string };

type DashboardClientProps = {
  largeEmails: ScanResult;
  promotions: ScanResult;
  social: ScanResult;
  summary: SummaryResult;
};

export function DashboardClient({
  largeEmails,
  promotions,
  social,
  summary,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('large-emails');

  return (
    <>
      <ScanSummaryCards summary={summary} onTabSelect={setActiveTab} />
      <EmailCategoryTabs
        largeEmails={largeEmails}
        promotions={promotions}
        social={social}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </>
  );
}
