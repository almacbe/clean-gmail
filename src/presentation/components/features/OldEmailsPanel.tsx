'use client';

import { useState } from 'react';
import type { AgeThreshold } from '@/application/dtos/ScanOldEmailsInput';
import { useOldEmailsScan } from '@/presentation/hooks/useOldEmailsScan';
import { OldEmailsTable } from '@/presentation/components/features/OldEmailsTable';

type OldEmailsPanelProps = {
  refreshKey?: number;
};

export function OldEmailsPanel({ refreshKey = 0 }: OldEmailsPanelProps) {
  const [olderThan, setOlderThan] = useState<AgeThreshold>('1y');
  const result = useOldEmailsScan(olderThan, refreshKey);

  return (
    <div data-testid="panel-old-emails">
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="old-emails-threshold" className="font-medium">
          Older than:
        </label>
        <select
          id="old-emails-threshold"
          className="select select-bordered select-sm"
          value={olderThan}
          onChange={(e) => setOlderThan(e.target.value as AgeThreshold)}
        >
          <option value="6m">6 months</option>
          <option value="1y">1 year</option>
          <option value="2y">2 years</option>
          <option value="5y">5 years</option>
        </select>
      </div>

      {result.status === 'loading' && (
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
      )}

      {result.status === 'error' && (
        <div
          role="alert"
          data-testid="old-emails-error"
          className="alert alert-error"
        >
          <span>Failed to load old emails. Please try again.</span>
        </div>
      )}

      {result.status === 'success' && (
        <OldEmailsTable emails={result.data.emails} />
      )}
    </div>
  );
}
