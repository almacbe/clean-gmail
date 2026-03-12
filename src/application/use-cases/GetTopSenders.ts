import type { GetTopSendersInput } from '@/application/dtos/GetTopSendersInput';
import type {
  GetTopSendersOutput,
  SenderSummaryDto,
} from '@/application/dtos/GetTopSendersOutput';

const TOP_SENDERS_LIMIT = 20;

export class GetTopSenders {
  execute(input: GetTopSendersInput): GetTopSendersOutput {
    const map = new Map<
      string,
      { emailCount: number; totalSizeBytes: number }
    >();

    for (const email of input.emails) {
      const existing = map.get(email.sender);
      if (existing) {
        existing.emailCount += 1;
        existing.totalSizeBytes += email.sizeEstimate;
      } else {
        map.set(email.sender, {
          emailCount: 1,
          totalSizeBytes: email.sizeEstimate,
        });
      }
    }

    const senders: SenderSummaryDto[] = Array.from(map.entries()).map(
      ([sender, stats]) => ({
        sender,
        emailCount: stats.emailCount,
        totalSizeBytes: stats.totalSizeBytes,
      }),
    );

    senders.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    return {
      senders: senders.slice(0, TOP_SENDERS_LIMIT),
    };
  }
}
