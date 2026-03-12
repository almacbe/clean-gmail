export type EmailMetadataDto = {
  readonly id: string;
  readonly sender: string;
  readonly subject: string;
  readonly date: string; // ISO 8601 — JSON-serializable
  readonly sizeEstimate: number;
};

export type ScanLargeEmailsOutput = {
  readonly emails: EmailMetadataDto[];
};
