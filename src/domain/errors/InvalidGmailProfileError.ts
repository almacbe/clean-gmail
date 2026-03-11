export class InvalidGmailProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGmailProfileError';
  }
}
