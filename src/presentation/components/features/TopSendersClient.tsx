'use client';

import { useTopSenders } from '@/presentation/hooks/useTopSenders';
import { TopSendersTable } from '@/presentation/components/features/TopSendersTable';

type TopSendersClientProps = {
  refreshKey?: number;
};

function TableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            {[...Array(4)].map((_, i) => (
              <th key={i}>
                <div className="skeleton h-4 w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              {[...Array(4)].map((_, j) => (
                <td key={j}>
                  <div className="skeleton h-4 w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TopSendersClient({ refreshKey = 0 }: TopSendersClientProps) {
  const result = useTopSenders(refreshKey);

  if (result.status === 'loading') {
    return <TableSkeleton />;
  }

  if (result.status === 'error') {
    return (
      <div
        role="alert"
        data-testid="top-senders-error"
        className="alert alert-error"
      >
        <span>{result.message}</span>
      </div>
    );
  }

  return <TopSendersTable senders={result.data.senders} />;
}
