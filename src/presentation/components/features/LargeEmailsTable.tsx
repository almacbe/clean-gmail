import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import { formatBytes } from '@/shared/utils/formatBytes';
import { formatDate } from '@/shared/utils/formatDate';

type LargeEmailsTableProps = {
  emails: EmailMetadataDto[];
  selectedIds?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onSelectBySender?: (
    sender: string,
    scope: readonly EmailMetadataDto[],
  ) => void;
};

export function LargeEmailsTable({
  emails,
  selectedIds = new Set(),
  onToggle,
  onSelectAll,
  onSelectBySender,
}: LargeEmailsTableProps) {
  if (emails.length === 0) {
    return (
      <div
        className="text-center py-8 text-base-content/60"
        data-testid="large-emails-empty"
      >
        No large emails found.
      </div>
    );
  }

  const sorted = [...emails].sort((a, b) => b.sizeEstimate - a.sizeEstimate);
  const totalSize = emails.reduce((sum, e) => sum + e.sizeEstimate, 0);
  const allIds = sorted.map((e) => e.id);
  const selectedInTable = allIds.filter((id) => selectedIds.has(id));
  const allSelected =
    allIds.length > 0 && selectedInTable.length === allIds.length;
  const someSelected = selectedInTable.length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th className="w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => onSelectAll?.(allIds)}
                data-testid="select-all-checkbox"
                aria-label="Select all large emails"
              />
            </th>
            <th>Sender</th>
            <th>Subject</th>
            <th>Date</th>
            <th className="text-right">Size</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((email) => (
            <tr key={email.id}>
              <td>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selectedIds.has(email.id)}
                  onChange={() => onToggle?.(email.id)}
                  data-testid={`checkbox-${email.id}`}
                  aria-label={`Select ${email.subject || email.sender}`}
                />
              </td>
              <td className="max-w-xs" title={email.sender}>
                <div className="flex items-center gap-2">
                  <span className="truncate">{email.sender}</span>
                  {onSelectBySender && (
                    <button
                      className="btn btn-ghost btn-xs shrink-0 opacity-60 hover:opacity-100"
                      onClick={() => onSelectBySender(email.sender, emails)}
                      title={`Select all from ${email.sender}`}
                    >
                      all
                    </button>
                  )}
                </div>
              </td>
              <td className="max-w-xs truncate" title={email.subject}>
                {email.subject || '(no subject)'}
              </td>
              <td className="whitespace-nowrap">{formatDate(email.date)}</td>
              <td className="text-right whitespace-nowrap">
                {formatBytes(email.sizeEstimate)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td
              colSpan={3}
              className="font-semibold"
              data-testid="large-emails-count"
            >
              {emails.length} large email{emails.length !== 1 ? 's' : ''}
            </td>
            <td
              className="text-right font-semibold"
              data-testid="large-emails-total-size"
            >
              {formatBytes(totalSize)} total
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
