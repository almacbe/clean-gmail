'use client';

import { useState, useEffect } from 'react';
import { GetTopSenders } from '@/application/use-cases/GetTopSenders';
import type { GetTopSendersOutput } from '@/application/dtos/GetTopSendersOutput';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';
import { readCache, CACHE_KEYS } from '@/shared/utils/scanCache';

export type TopSendersHookResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: GetTopSendersOutput };

const OLD_EMAIL_THRESHOLDS = ['6m', '1y', '2y', '5y'] as const;

export function useTopSenders(refreshKey = 0): TopSendersHookResult {
  const [result, setResult] = useState<TopSendersHookResult>({
    status: 'loading',
  });

  useEffect(
    function computeTopSenders() {
      let cancelled = false;

      async function run() {
        const allEmails: EmailMetadataDto[] = [];
        const seenIds = new Set<string>();

        function addEmails(emails: EmailMetadataDto[]) {
          for (const email of emails) {
            if (!seenIds.has(email.id)) {
              seenIds.add(email.id);
              allEmails.push(email);
            }
          }
        }

        const largeEmails = readCache<ScanEmailsOutput>(
          CACHE_KEYS.LARGE_EMAILS,
        );
        if (largeEmails) addEmails(largeEmails.emails);

        const promotions = readCache<ScanEmailsOutput>(CACHE_KEYS.PROMOTIONS);
        if (promotions) addEmails(promotions.emails);

        const social = readCache<ScanEmailsOutput>(CACHE_KEYS.SOCIAL);
        if (social) addEmails(social.emails);

        for (const threshold of OLD_EMAIL_THRESHOLDS) {
          const oldEmails = readCache<ScanEmailsOutput>(
            CACHE_KEYS.oldEmails(threshold),
          );
          if (oldEmails) addEmails(oldEmails.emails);
        }

        if (allEmails.length === 0) {
          if (!cancelled) {
            setResult({
              status: 'error',
              message: 'No scan data available. Please scan first.',
            });
          }
          return;
        }

        const useCase = new GetTopSenders();
        const data = useCase.execute({ emails: allEmails });
        if (!cancelled) {
          setResult({ status: 'success', data });
        }
      }

      void run();

      return () => {
        cancelled = true;
      };
    },
    [refreshKey],
  );

  return result;
}
