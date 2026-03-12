'use client';

import { useRecommendations } from '@/presentation/hooks/useRecommendations';
import { RecommendationsList } from '@/presentation/components/features/RecommendationsList';

type RecommendationsClientProps = {
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
          {[...Array(4)].map((_, i) => (
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

export function RecommendationsClient({
  refreshKey = 0,
}: RecommendationsClientProps) {
  const result = useRecommendations(refreshKey);

  if (result.status === 'loading') {
    return <TableSkeleton />;
  }

  if (result.status === 'error') {
    return (
      <div
        role="alert"
        data-testid="recommendations-error"
        className="alert alert-error"
      >
        <span>{result.message}</span>
      </div>
    );
  }

  return <RecommendationsList recommendations={result.data.recommendations} />;
}
