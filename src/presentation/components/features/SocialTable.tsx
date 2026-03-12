import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';
import { formatBytes } from '@/shared/utils/formatBytes';
import { formatDate } from '@/shared/utils/formatDate';

type SocialTableProps = {
  emails: EmailMetadataDto[];
};

export function SocialTable({ emails }: SocialTableProps) {
  if (emails.length === 0) {
    return (
      <div
        className="text-center py-8 text-base-content/60"
        data-testid="social-empty"
      >
        No social emails found.
      </div>
    );
  }

  const sorted = [...emails].sort((a, b) => b.sizeEstimate - a.sizeEstimate);
  const totalSize = emails.reduce((sum, e) => sum + e.sizeEstimate, 0);

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Sender</th>
            <th>Subject</th>
            <th>Date</th>
            <th className="text-right">Size</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((email) => (
            <tr key={email.id}>
              <td className="max-w-xs truncate" title={email.sender}>
                {email.sender}
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
            <td
              colSpan={3}
              className="font-semibold"
              data-testid="social-count"
            >
              {emails.length} social email{emails.length !== 1 ? 's' : ''}
            </td>
            <td
              className="text-right font-semibold"
              data-testid="social-total-size"
            >
              {formatBytes(totalSize)} total
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
