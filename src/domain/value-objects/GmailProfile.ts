import { InvalidGmailProfileError } from '@/domain/errors/InvalidGmailProfileError';

export class GmailProfile {
  readonly emailAddress: string;
  readonly messagesTotal: number;
  readonly threadsTotal: number;

  private constructor(
    emailAddress: string,
    messagesTotal: number,
    threadsTotal: number,
  ) {
    this.emailAddress = emailAddress;
    this.messagesTotal = messagesTotal;
    this.threadsTotal = threadsTotal;
  }

  static create(
    emailAddress: string,
    messagesTotal: number,
    threadsTotal: number,
  ): GmailProfile {
    if (!emailAddress || emailAddress.trim().length === 0) {
      throw new InvalidGmailProfileError(
        'emailAddress must be a non-empty string',
      );
    }
    if (!Number.isInteger(messagesTotal) || messagesTotal < 0) {
      throw new InvalidGmailProfileError(
        'messagesTotal must be a non-negative integer',
      );
    }
    if (!Number.isInteger(threadsTotal) || threadsTotal < 0) {
      throw new InvalidGmailProfileError(
        'threadsTotal must be a non-negative integer',
      );
    }

    return new GmailProfile(emailAddress, messagesTotal, threadsTotal);
  }

  equals(other: GmailProfile): boolean {
    return (
      this.emailAddress === other.emailAddress &&
      this.messagesTotal === other.messagesTotal &&
      this.threadsTotal === other.threadsTotal
    );
  }
}
