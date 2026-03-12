export type CategorySummary = {
  readonly count: number;
  readonly totalSizeBytes: number;
};

export type GetScanSummaryOutput = {
  readonly largeEmails: CategorySummary;
  readonly promotions: CategorySummary;
  readonly social: CategorySummary;
  readonly oldEmails: CategorySummary;
};
