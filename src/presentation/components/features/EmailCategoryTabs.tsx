'use client';

import { useState } from 'react';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import { LargeEmailsTable } from '@/presentation/components/features/LargeEmailsTable';
import { OldEmailsPanel } from '@/presentation/components/features/OldEmailsPanel';
import { PromotionsTable } from '@/presentation/components/features/PromotionsTable';
import { SocialTable } from '@/presentation/components/features/SocialTable';

type ScanHookResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: { emails: EmailMetadataDto[] } };

export type TabId = 'large-emails' | 'promotions' | 'social' | 'old-emails';

type EmailCategoryTabsProps = {
  largeEmails: ScanHookResult;
  promotions: ScanHookResult;
  social: ScanHookResult;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  refreshKey?: number;
  selectedIds?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onSelectBySender?: (
    sender: string,
    scope: readonly EmailMetadataDto[],
  ) => void;
  onOldEmailsChange?: (emails: EmailMetadataDto[]) => void;
};

function TableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            {[...Array(4)].map((_, i) => (
              <th key={i}>
                <div className="skeleton h-4 w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              {[...Array(4)].map((_, j) => (
                <td key={j}>
                  <div className="skeleton h-4 w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmailCategoryTabs({
  largeEmails,
  promotions,
  social,
  activeTab: controlledActiveTab,
  onTabChange,
  refreshKey = 0,
  selectedIds,
  onToggle,
  onSelectAll,
  onSelectBySender,
  onOldEmailsChange,
}: EmailCategoryTabsProps) {
  const [internalActiveTab, setInternalActiveTab] =
    useState<TabId>('large-emails');

  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: TabId) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

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
        <button
          role="tab"
          className={`tab${activeTab === 'social' ? ' tab-active' : ''}`}
          onClick={() => setActiveTab('social')}
          data-testid="tab-social"
        >
          Social
        </button>
        <button
          role="tab"
          className={`tab${activeTab === 'old-emails' ? ' tab-active' : ''}`}
          onClick={() => setActiveTab('old-emails')}
          data-testid="tab-old-emails"
        >
          Old Emails
        </button>
      </div>

      {activeTab === 'large-emails' && (
        <div data-testid="panel-large-emails">
          {largeEmails.status === 'loading' && <TableSkeleton />}
          {largeEmails.status === 'error' && (
            <div
              role="alert"
              data-testid="large-emails-error"
              className="alert alert-error"
            >
              <span>Failed to load large emails. Please try again.</span>
            </div>
          )}
          {largeEmails.status === 'success' && (
            <LargeEmailsTable
              emails={largeEmails.data.emails}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onSelectBySender={onSelectBySender}
            />
          )}
        </div>
      )}

      {activeTab === 'promotions' && (
        <div data-testid="panel-promotions">
          {promotions.status === 'loading' && <TableSkeleton />}
          {promotions.status === 'error' && (
            <div
              role="alert"
              data-testid="promotions-error"
              className="alert alert-error"
            >
              <span>Failed to load promotions. Please try again.</span>
            </div>
          )}
          {promotions.status === 'success' && (
            <PromotionsTable
              emails={promotions.data.emails}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onSelectBySender={onSelectBySender}
            />
          )}
        </div>
      )}

      {activeTab === 'social' && (
        <div data-testid="panel-social">
          {social.status === 'loading' && <TableSkeleton />}
          {social.status === 'error' && (
            <div
              role="alert"
              data-testid="social-error"
              className="alert alert-error"
            >
              <span>Failed to load social emails. Please try again.</span>
            </div>
          )}
          {social.status === 'success' && (
            <SocialTable
              emails={social.data.emails}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onSelectBySender={onSelectBySender}
            />
          )}
        </div>
      )}

      {activeTab === 'old-emails' && (
        <OldEmailsPanel
          refreshKey={refreshKey}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onSelectAll={onSelectAll}
          onSelectBySender={onSelectBySender}
          onEmailsChange={onOldEmailsChange}
        />
      )}
    </div>
  );
}
