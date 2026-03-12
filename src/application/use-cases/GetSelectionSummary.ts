import type { GetSelectionSummaryInput } from '@/application/dtos/GetSelectionSummaryInput';
import type { GetSelectionSummaryOutput } from '@/application/dtos/GetSelectionSummaryOutput';

/** Computes the count and total size of the currently selected emails. */
export class GetSelectionSummary {
  execute(input: GetSelectionSummaryInput): GetSelectionSummaryOutput {
    let selectedCount = 0;
    let totalSizeBytes = 0;

    for (const email of input.emails) {
      if (input.selectedIds.has(email.id)) {
        selectedCount += 1;
        totalSizeBytes += email.sizeEstimate;
      }
    }

    return { selectedCount, totalSizeBytes };
  }
}
