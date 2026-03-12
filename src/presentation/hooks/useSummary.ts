'use client';

import { useState, useEffect } from 'react';
import type { AgeThreshold } from '@/application/dtos/ScanOldEmailsInput';
import type { GetScanSummaryOutput } from '@/application/dtos/GetScanSummaryOutput';
import { readCache, writeCache, CACHE_KEYS } from '@/shared/utils/scanCache';

export type SummaryHookResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: GetScanSummaryOutput };

export function useSummary(
  olderThan: AgeThreshold,
  refreshKey = 0,
): SummaryHookResult {
  const [result, setResult] = useState<SummaryHookResult>({
    status: 'loading',
  });

  useEffect(
    function fetchSummary() {
      let cancelled = false;

      async function run() {
        const cacheKey = CACHE_KEYS.summary(olderThan);
        const cached = readCache<GetScanSummaryOutput>(cacheKey);
        if (cached) {
          if (!cancelled) setResult({ status: 'success', data: cached });
          return;
        }

        if (!cancelled) setResult({ status: 'loading' });

        try {
          const res = await fetch(`/api/scan/summary?olderThan=${olderThan}`);
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            if (!cancelled) {
              setResult({
                status: 'error',
                message: body.error ?? 'Failed to fetch scan summary',
              });
            }
            return;
          }
          const data = (await res.json()) as GetScanSummaryOutput;
          writeCache(cacheKey, data);
          if (!cancelled) {
            setResult({ status: 'success', data });
          }
        } catch (err: unknown) {
          if (!cancelled) {
            const message =
              err instanceof Error
                ? err.message
                : 'Failed to fetch scan summary';
            setResult({ status: 'error', message });
          }
        }
      }

      void run();

      return () => {
        cancelled = true;
      };
    },
    [olderThan, refreshKey],
  );

  return result;
}
