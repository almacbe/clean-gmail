'use client';

import { useEffect, useRef } from 'react';

type UndoToastProps = {
  trashedIds: string[];
  onUndo: (ids: string[]) => void;
  onDismiss: () => void;
  isUndoing: boolean;
  undoError: string | null;
};

export function UndoToast({
  trashedIds,
  onUndo,
  onDismiss,
  isUndoing,
  undoError,
}: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trashedIds.length === 0) return;

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, 30_000);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [trashedIds, onDismiss]);

  if (trashedIds.length === 0) return null;

  function handleUndo() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    onUndo(trashedIds);
  }

  return (
    <div
      className="toast toast-bottom toast-center z-50"
      data-testid="undo-toast"
    >
      <div className="alert alert-info flex flex-col items-start gap-2 shadow-lg sm:flex-row sm:items-center">
        <span>
          {trashedIds.length} email{trashedIds.length !== 1 ? 's' : ''} moved to
          Trash.
        </span>
        <div className="flex items-center gap-2">
          {undoError !== null && (
            <span className="text-error text-sm" data-testid="undo-error">
              {undoError}
            </span>
          )}
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleUndo}
            disabled={isUndoing}
            data-testid="undo-button"
          >
            {isUndoing ? (
              <span
                className="loading loading-spinner loading-xs"
                data-testid="undo-loading"
              />
            ) : (
              'Undo'
            )}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onDismiss}
            disabled={isUndoing}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
