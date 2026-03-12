'use client';

import { useState } from 'react';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import { LargeEmailsTable } from '@/presentation/components/features/LargeEmailsTable';
import { OldEmailsPanel } from '@/presentation/components/features/OldEmailsPanel';
import { PromotionsTable } from '@/presentation/components/features/PromotionsTable';
import { SocialTable } from '@/presentation/components/features/SocialTable';

type ScanResult = { emails: EmailMetadataDto[] } | { error: string };

export type TabId = 'large-emails' | 'promotions' | 'social' | 'old-emails';

type EmailCategoryTabsProps = {
  largeEmails: ScanResult;
  promotions: ScanResult;
  social: ScanResult;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
};

export function EmailCategoryTabs({
  largeEmails,
  promotions,
  social,
  activeTab: controlledActiveTab,
  onTabChange,
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

      {activeTab === 'social' && (
        <div data-testid="panel-social">
          {'error' in social ? (
            <div
              role="alert"
              data-testid="social-error"
              className="alert alert-error"
            >
              <span>Failed to load social emails. Please try again.</span>
            </div>
          ) : (
            <SocialTable emails={social.emails} />
          )}
        </div>
      )}

      {activeTab === 'old-emails' && <OldEmailsPanel />}
    </div>
  );
}
