'use client';

import { useState, useEffect } from 'react';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';
import { readCache, writeCache, CACHE_KEYS } from '@/shared/utils/scanCache';

export type ScanHookResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: ScanEmailsOutput };

export function useLargeEmailsScan(refreshKey = 0): ScanHookResult {
  const [result, setResult] = useState<ScanHookResult>({ status: 'loading' });

  useEffect(
    function fetchLargeEmails() {
      let cancelled = false;

      async function run() {
        const cached = readCache<ScanEmailsOutput>(CACHE_KEYS.LARGE_EMAILS);
        if (cached) {
          if (!cancelled) setResult({ status: 'success', data: cached });
          return;
        }

        if (!cancelled) setResult({ status: 'loading' });

        try {
          const res = await fetch('/api/scan/large-emails');
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            if (!cancelled) {
              setResult({
                status: 'error',
                message: body.error ?? 'Failed to scan large emails',
              });
            }
            return;
          }
          const data = (await res.json()) as ScanEmailsOutput;
          writeCache(CACHE_KEYS.LARGE_EMAILS, data);
          if (!cancelled) {
            setResult({ status: 'success', data });
          }
        } catch (err: unknown) {
          if (!cancelled) {
            const message =
              err instanceof Error
                ? err.message
                : 'Failed to scan large emails';
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
