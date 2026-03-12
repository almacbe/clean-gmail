export class InvalidEmailMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailMetadataError';
  }
}
