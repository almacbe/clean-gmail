export interface SenderSummaryDto {
  readonly sender: string;
  readonly emailCount: number;
  readonly totalSizeBytes: number;
}

export interface GetTopSendersOutput {
  readonly senders: readonly SenderSummaryDto[];
}
