import { formatBytes } from '@/shared/utils/formatBytes';

type DeletePreviewModalProps = {
  isOpen: boolean;
  selectedCount: number;
  totalSizeBytes: number;
  affectedSenders: readonly string[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeletePreviewModal({
  isOpen,
  selectedCount,
  totalSizeBytes,
  affectedSenders,
  onCancel,
  onConfirm,
}: DeletePreviewModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-preview-title"
      data-testid="delete-preview-modal"
    >
      <div className="w-full max-w-lg rounded-xl bg-base-100 p-6 shadow-2xl">
        <h2 id="delete-preview-title" className="text-xl font-semibold">
          Confirm delete
        </h2>

        <div className="mt-4 space-y-2">
          <p data-testid="delete-preview-count">
            {selectedCount} email{selectedCount !== 1 ? 's' : ''} selected
          </p>
          <p data-testid="delete-preview-size">
            {formatBytes(totalSizeBytes)} will be moved to Trash
          </p>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
            Senders affected
          </h3>
          {affectedSenders.length === 0 ? (
            <p className="mt-2 text-sm text-base-content/70">
              No senders selected.
            </p>
          ) : (
            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5">
              {affectedSenders.map((sender) => (
                <li
                  key={sender}
                  data-testid={`delete-preview-sender-${sender}`}
                >
                  {sender}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            data-testid="delete-preview-cancel"
          >
            Cancel
          </button>
          <button
            className="btn btn-error"
            onClick={onConfirm}
            data-testid="delete-preview-confirm"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}
