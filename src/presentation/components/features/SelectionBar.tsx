import { formatBytes } from '@/shared/utils/formatBytes';

type SelectionBarProps = {
  selectedCount: number;
  totalSizeBytes: number;
  onClear: () => void;
  onDeleteSelected: () => void;
};

export function SelectionBar({
  selectedCount,
  totalSizeBytes,
  onClear,
  onDeleteSelected,
}: SelectionBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-base-300 bg-base-200 px-4 py-3 shadow-lg"
      data-testid="selection-bar"
    >
      <div className="flex items-center gap-3">
        <span className="font-medium" data-testid="selection-count">
          {selectedCount} email{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <span className="text-base-content/70" data-testid="selection-size">
          {formatBytes(totalSizeBytes)} to be freed
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClear}
          data-testid="selection-clear"
        >
          Clear Selection
        </button>
        <button
          className="btn btn-error btn-sm"
          onClick={onDeleteSelected}
          data-testid="selection-delete"
        >
          Delete Selected
        </button>
      </div>
    </div>
  );
}
