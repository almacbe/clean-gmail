'use client';

import { useState } from 'react';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import { LargeEmailsTable } from '@/presentation/components/features/LargeEmailsTable';
import { PromotionsTable } from '@/presentation/components/features/PromotionsTable';

type ScanResult = { emails: EmailMetadataDto[] } | { error: string };

type EmailCategoryTabsProps = {
  largeEmails: ScanResult;
  promotions: ScanResult;
};

type TabId = 'large-emails' | 'promotions';

export function EmailCategoryTabs({
  largeEmails,
  promotions,
}: EmailCategoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('large-emails');

  return (
    <div>
      <div role="tablist" className="tabs tabs-bordered mb-4">
        <button
          role="tab"
          className={`tab${activeTab === 'large-emails' ? ' tab-active' : ''}`}
          onClick={() => setActiveTab('large-emails')}
          data-testid="tab-large-emails"
        >
          Large Emails (&gt;5 MB)
        </button>
        <button
          role="tab"
          className={`tab${activeTab === 'promotions' ? ' tab-active' : ''}`}
          onClick={() => setActiveTab('promotions')}
          data-testid="tab-promotions"
        >
          Promotions
        </button>
      </div>

      {activeTab === 'large-emails' && (
        <div data-testid="panel-large-emails">
          {'error' in largeEmails ? (
            <div
              role="alert"
              data-testid="large-emails-error"
              className="alert alert-error"
            >
              <span>Failed to load large emails. Please try again.</span>
            </div>
          ) : (
            <LargeEmailsTable emails={largeEmails.emails} />
          )}
        </div>
      )}

      {activeTab === 'promotions' && (
        <div data-testid="panel-promotions">
          {'error' in promotions ? (
            <div
              role="alert"
              data-testid="promotions-error"
              className="alert alert-error"
            >
              <span>Failed to load promotions. Please try again.</span>
            </div>
          ) : (
            <PromotionsTable emails={promotions.emails} />
          )}
        </div>
      )}
    </div>
  );
}
