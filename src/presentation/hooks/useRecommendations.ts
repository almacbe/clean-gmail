'use client';

import { useState, useEffect } from 'react';
import { GetRecommendations } from '@/application/use-cases/GetRecommendations';
import type { GetRecommendationsOutput } from '@/application/dtos/GetRecommendationsOutput';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';
import { readCache, CACHE_KEYS } from '@/shared/utils/scanCache';

export type RecommendationsHookResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: GetRecommendationsOutput };

const OLD_EMAIL_THRESHOLDS = ['6m', '1y', '2y', '5y'] as const;

export function useRecommendations(refreshKey = 0): RecommendationsHookResult {
  const [result, setResult] = useState<RecommendationsHookResult>({
    status: 'loading',
  });

  useEffect(
    function computeRecommendations() {
      let cancelled = false;

      function run() {
        const largeEmailsCache = readCache<ScanEmailsOutput>(
          CACHE_KEYS.LARGE_EMAILS,
        );
        const promotionsCache = readCache<ScanEmailsOutput>(
          CACHE_KEYS.PROMOTIONS,
        );
        const socialCache = readCache<ScanEmailsOutput>(CACHE_KEYS.SOCIAL);

        const oldEmailsMap = new Map<string, EmailMetadataDto>();
        for (const threshold of OLD_EMAIL_THRESHOLDS) {
          const cached = readCache<ScanEmailsOutput>(
            CACHE_KEYS.oldEmails(threshold),
          );
          if (cached) {
            for (const email of cached.emails) {
              if (!oldEmailsMap.has(email.id)) {
                oldEmailsMap.set(email.id, email);
              }
            }
          }
        }

        const largeEmails = largeEmailsCache?.emails ?? [];
        const promotions = promotionsCache?.emails ?? [];
        const social = socialCache?.emails ?? [];
        const oldEmails = Array.from(oldEmailsMap.values());

        const hasData =
          largeEmails.length > 0 ||
          promotions.length > 0 ||
          social.length > 0 ||
          oldEmails.length > 0;

        if (
          !hasData &&
          !largeEmailsCache &&
          !promotionsCache &&
          !socialCache &&
          oldEmailsMap.size === 0
        ) {
          if (!cancelled) {
            setResult({
              status: 'error',
              message: 'No scan data available. Please scan first.',
            });
          }
          return;
        }

        const useCase = new GetRecommendations();
        const data = useCase.execute({
          largeEmails,
          promotions,
          social,
          oldEmails,
        });
        if (!cancelled) {
          setResult({ status: 'success', data });
        }
      }

      run();

      return () => {
        cancelled = true;
      };
    },
    [refreshKey],
  );

  return result;
}
