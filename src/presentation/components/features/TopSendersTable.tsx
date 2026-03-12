import type { SenderSummaryDto } from '@/application/dtos/GetTopSendersOutput';
import { formatBytes } from '@/shared/utils/formatBytes';

type TopSendersTableProps = {
  senders: readonly SenderSummaryDto[];
};

export function TopSendersTable({ senders }: TopSendersTableProps) {
  if (senders.length === 0) {
    return (
      <div
        className="text-center py-8 text-base-content/60"
        data-testid="top-senders-empty"
      >
        No sender data available.
      </div>
    );
  }

  const totalCount = senders.reduce((sum, s) => sum + s.emailCount, 0);
  const totalSize = senders.reduce((sum, s) => sum + s.totalSizeBytes, 0);

  return (
    <div className="overflow-x-auto">
      <table
        className="table table-zebra w-full"
        data-testid="top-senders-table"
      >
        <thead>
          <tr>
            <th>#</th>
            <th>Sender</th>
            <th className="text-right">Email Count</th>
            <th className="text-right">Total Size</th>
          </tr>
        </thead>
        <tbody>
          {senders.map((sender, index) => (
            <tr key={sender.sender}>
              <td className="font-mono text-base-content/50">{index + 1}</td>
              <td className="max-w-xs truncate" title={sender.sender}>
                {sender.sender}
              </td>
              <td className="text-right">{sender.emailCount}</td>
              <td className="text-right whitespace-nowrap">
                {formatBytes(sender.totalSizeBytes)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="font-semibold" data-testid="top-senders-count">
              {senders.length} sender{senders.length !== 1 ? 's' : ''}
            </td>
            <td
              className="text-right font-semibold"
              data-testid="top-senders-email-count"
            >
              {totalCount} email{totalCount !== 1 ? 's' : ''}
            </td>
            <td
              className="text-right font-semibold whitespace-nowrap"
              data-testid="top-senders-total-size"
            >
              {formatBytes(totalSize)} total
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
