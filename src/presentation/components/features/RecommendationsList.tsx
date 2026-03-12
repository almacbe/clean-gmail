import type { RecommendationDto } from '@/application/dtos/GetRecommendationsOutput';
import { formatBytes } from '@/shared/utils/formatBytes';

type RecommendationsListProps = {
  recommendations: readonly RecommendationDto[];
};

export function RecommendationsList({
  recommendations,
}: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div
        className="text-center py-8 text-base-content/60"
        data-testid="recommendations-empty"
      >
        No recommendations available. Scan your emails first.
      </div>
    );
  }

  const totalCount = recommendations.reduce((sum, r) => sum + r.emailCount, 0);
  const totalSize = recommendations.reduce(
    (sum, r) => sum + r.totalSizeBytes,
    0,
  );

  return (
    <div className="overflow-x-auto">
      <table
        className="table table-zebra w-full"
        data-testid="recommendations-list"
      >
        <thead>
          <tr>
            <th>#</th>
            <th>Action</th>
            <th className="text-right">Emails</th>
            <th className="text-right">Space Saved</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, index) => (
            <tr key={rec.category}>
              <td className="font-mono text-base-content/50">{index + 1}</td>
              <td>
                Delete {rec.emailCount} {rec.category.toLowerCase()}
              </td>
              <td className="text-right">{rec.emailCount}</td>
              <td className="text-right whitespace-nowrap">
                {formatBytes(rec.totalSizeBytes)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="font-semibold" data-testid="recommendations-count">
              {recommendations.length} categor
              {recommendations.length !== 1 ? 'ies' : 'y'}
            </td>
            <td
              className="text-right font-semibold"
              data-testid="recommendations-email-count"
            >
              {totalCount} email{totalCount !== 1 ? 's' : ''}
            </td>
            <td
              className="text-right font-semibold whitespace-nowrap"
              data-testid="recommendations-total-size"
            >
              {formatBytes(totalSize)} total
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
