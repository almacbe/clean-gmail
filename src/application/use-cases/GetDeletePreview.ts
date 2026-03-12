import type { GetDeletePreviewInput } from '@/application/dtos/GetDeletePreviewInput';
import type { GetDeletePreviewOutput } from '@/application/dtos/GetDeletePreviewOutput';

/** Computes confirmation preview data for selected emails before deletion. */
export class GetDeletePreview {
  execute(input: GetDeletePreviewInput): GetDeletePreviewOutput {
    let selectedCount = 0;
    let totalSizeBytes = 0;
    const affectedSenders = new Set<string>();

    for (const email of input.emails) {
      if (input.selectedIds.has(email.id)) {
        selectedCount += 1;
        totalSizeBytes += email.sizeEstimate;
        affectedSenders.add(email.sender);
      }
    }

    return {
      selectedCount,
      totalSizeBytes,
      affectedSenders: [...affectedSenders],
    };
  }
}
