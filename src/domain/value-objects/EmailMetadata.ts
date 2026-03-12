import { InvalidEmailMetadataError } from '@/domain/errors/InvalidEmailMetadataError';

export class EmailMetadata {
  readonly id: string;
  readonly sender: string;
  readonly subject: string;
  readonly date: Date;
  readonly sizeEstimate: number;

  private constructor(
    id: string,
    sender: string,
    subject: string,
    date: Date,
    sizeEstimate: number,
  ) {
    this.id = id;
    this.sender = sender;
    this.subject = subject;
    this.date = date;
    this.sizeEstimate = sizeEstimate;
  }

  static create(
    id: string,
    sender: string,
    subject: string,
    date: Date,
    sizeEstimate: number,
  ): EmailMetadata {
    if (!id || id.trim().length === 0) {
      throw new InvalidEmailMetadataError('id must be a non-empty string');
    }
    if (!Number.isInteger(sizeEstimate) || sizeEstimate < 0) {
      throw new InvalidEmailMetadataError(
        'sizeEstimate must be a non-negative integer',
      );
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new InvalidEmailMetadataError('date must be a valid Date');
    }

    return new EmailMetadata(id, sender, subject, date, sizeEstimate);
  }
}
