'use client';

import { useState, useEffect } from 'react';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';
import { readCache, writeCache, CACHE_KEYS } from '@/shared/utils/scanCache';

export type ScanHookResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: ScanEmailsOutput };

export function usePromotionsScan(refreshKey = 0): ScanHookResult {
  const [result, setResult] = useState<ScanHookResult>({ status: 'loading' });

  useEffect(
    function fetchPromotions() {
      let cancelled = false;

      async function run() {
        const cached = readCache<ScanEmailsOutput>(CACHE_KEYS.PROMOTIONS);
        if (cached) {
          if (!cancelled) setResult({ status: 'success', data: cached });
          return;
        }

        if (!cancelled) setResult({ status: 'loading' });

        try {
          const res = await fetch('/api/scan/promotions');
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            if (!cancelled) {
              setResult({
                status: 'error',
                message: body.error ?? 'Failed to scan promotions',
              });
            }
            return;
          }
          const data = (await res.json()) as ScanEmailsOutput;
          writeCache(CACHE_KEYS.PROMOTIONS, data);
          if (!cancelled) {
            setResult({ status: 'success', data });
          }
        } catch (err: unknown) {
          if (!cancelled) {
            const message =
              err instanceof Error ? err.message : 'Failed to scan promotions';
            setResult({ status: 'error', message });
          }
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
