'use client';

import { useState, useCallback } from 'react';

type TrashEmailsState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; trashedCount: number }
  | { status: 'error'; message: string };

type UseTrashEmailsResult = {
  isPending: boolean;
  error: Error | null;
  mutate: (
    variables: { ids: string[] },
    callbacks?: { onSuccess?: (trashedCount: number) => void },
  ) => void;
  reset: () => void;
};

export function useTrashEmails(): UseTrashEmailsResult {
  const [state, setState] = useState<TrashEmailsState>({ status: 'idle' });

  const mutate = useCallback(
    (
      variables: { ids: string[] },
      callbacks?: { onSuccess?: (trashedCount: number) => void },
    ) => {
      setState({ status: 'pending' });

      async function run() {
        try {
          const res = await fetch('/api/emails/trash', {
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
                : (body.error ?? 'Failed to delete emails. Please try again.');
            setState({ status: 'error', message });
            return;
          }

          const data = (await res.json()) as { trashedCount: number };
          setState({ status: 'success', trashedCount: data.trashedCount });
          callbacks?.onSuccess?.(data.trashedCount);
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to delete emails. Please try again.';
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
