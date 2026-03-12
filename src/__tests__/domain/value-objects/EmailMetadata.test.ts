import { describe, it, expect } from 'vitest';
import { EmailMetadata } from '@/domain/value-objects/EmailMetadata';
import { InvalidEmailMetadataError } from '@/domain/errors/InvalidEmailMetadataError';

const validDate = new Date('2024-01-15T10:00:00.000Z');

describe('EmailMetadata', () => {
  it('returns EmailMetadata with correct fields for valid input', () => {
    const metadata = EmailMetadata.create(
      'msg-123',
      'sender@example.com',
      'Hello World',
      validDate,
      1024000,
    );

    expect(metadata).toBeInstanceOf(EmailMetadata);
    expect(metadata.id).toBe('msg-123');
    expect(metadata.sender).toBe('sender@example.com');
    expect(metadata.subject).toBe('Hello World');
    expect(metadata.date).toBe(validDate);
    expect(metadata.sizeEstimate).toBe(1024000);
  });

  it('throws InvalidEmailMetadataError when id is empty string', () => {
    expect(() =>
      EmailMetadata.create('', 'sender@example.com', 'Subject', validDate, 100),
    ).toThrow(InvalidEmailMetadataError);
  });

  it('throws InvalidEmailMetadataError when id is whitespace only', () => {
    expect(() =>
      EmailMetadata.create(
        '   ',
        'sender@example.com',
        'Subject',
        validDate,
        100,
      ),
    ).toThrow(InvalidEmailMetadataError);
  });

  it('throws InvalidEmailMetadataError when sizeEstimate is negative', () => {
    expect(() =>
      EmailMetadata.create(
        'msg-123',
        'sender@example.com',
        'Subject',
        validDate,
        -1,
      ),
    ).toThrow(InvalidEmailMetadataError);
  });

  it('throws InvalidEmailMetadataError when sizeEstimate is a non-integer (1.5)', () => {
    expect(() =>
      EmailMetadata.create(
        'msg-123',
        'sender@example.com',
        'Subject',
        validDate,
        1.5,
      ),
    ).toThrow(InvalidEmailMetadataError);
  });

  it('throws InvalidEmailMetadataError when date is invalid', () => {
    expect(() =>
      EmailMetadata.create(
        'msg-123',
        'sender@example.com',
        'Subject',
        new Date('invalid'),
        100,
      ),
    ).toThrow(InvalidEmailMetadataError);
  });

  it('allows empty subject and returns valid instance', () => {
    const metadata = EmailMetadata.create(
      'msg-123',
      'sender@example.com',
      '',
      validDate,
      100,
    );

    expect(metadata).toBeInstanceOf(EmailMetadata);
    expect(metadata.subject).toBe('');
  });

  it('allows zero sizeEstimate and returns valid instance', () => {
    const metadata = EmailMetadata.create(
      'msg-123',
      'sender@example.com',
      'Subject',
      validDate,
      0,
    );

    expect(metadata).toBeInstanceOf(EmailMetadata);
    expect(metadata.sizeEstimate).toBe(0);
  });
});
