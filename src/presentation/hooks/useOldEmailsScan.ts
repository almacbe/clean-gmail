'use client';

import { useState, useEffect } from 'react';
import type { AgeThreshold } from '@/application/dtos/ScanOldEmailsInput';
import type { ScanEmailsOutput } from '@/application/dtos/ScanLargeEmailsOutput';

type UseOldEmailsScanResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: ScanEmailsOutput };

export function useOldEmailsScan(
  olderThan: AgeThreshold,
): UseOldEmailsScanResult {
  const [result, setResult] = useState<UseOldEmailsScanResult>({
    status: 'loading',
  });

  useEffect(
    function fetchOldEmails() {
      let cancelled = false;

      async function run() {
        try {
          const res = await fetch(
            `/api/scan/old-emails?olderThan=${olderThan}`,
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            if (!cancelled) {
              setResult({
                status: 'error',
                message: body.error ?? 'Failed to scan old emails',
              });
            }
            return;
          }
          const data = (await res.json()) as ScanEmailsOutput;
          if (!cancelled) {
            setResult({ status: 'success', data });
          }
        } catch (err: unknown) {
          if (!cancelled) {
            const message =
              err instanceof Error ? err.message : 'Failed to scan old emails';
            setResult({ status: 'error', message });
          }
        }
      }

      void run();

      return () => {
        cancelled = true;
        setResult({ status: 'loading' });
      };
    },
    [olderThan],
  );

  return result;
}
