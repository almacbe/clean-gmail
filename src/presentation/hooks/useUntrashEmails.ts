'use client';

import { useState, useCallback } from 'react';

type UntrashEmailsState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; untrashedCount: number }
  | { status: 'error'; message: string };

type UseUntrashEmailsResult = {
  isPending: boolean;
  error: Error | null;
  mutate: (
    variables: { ids: string[] },
    callbacks?: { onSuccess?: (untrashedCount: number) => void },
  ) => void;
  reset: () => void;
};

export function useUntrashEmails(): UseUntrashEmailsResult {
  const [state, setState] = useState<UntrashEmailsState>({ status: 'idle' });

  const mutate = useCallback(
    (
      variables: { ids: string[] },
      callbacks?: { onSuccess?: (untrashedCount: number) => void },
    ) => {
      setState({ status: 'pending' });

      async function run() {
        try {
          const res = await fetch('/api/emails/untrash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: variables.ids }),
          });

          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            const message =
              res.status === 403
                ? 'Insufficient permissions — please sign out and sign back in to grant deletion access.'
                : (body.error ?? 'Failed to restore emails. Please try again.');
            setState({ status: 'error', message });
            return;
          }

          const data = (await res.json()) as { untrashedCount: number };
          setState({ status: 'success', untrashedCount: data.untrashedCount });
          callbacks?.onSuccess?.(data.untrashedCount);
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to restore emails. Please try again.';
          setState({ status: 'error', message });
        }
      }

      void run();
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return {
    isPending: state.status === 'pending',
    error: state.status === 'error' ? new Error(state.message) : null,
    mutate,
    reset,
  };
}
