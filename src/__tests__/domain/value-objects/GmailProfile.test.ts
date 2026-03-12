import { describe, it, expect } from 'vitest';
import { GmailProfile } from '@/domain/value-objects/GmailProfile';
import { InvalidGmailProfileError } from '@/domain/errors/InvalidGmailProfileError';

describe('GmailProfile.create()', () => {
  it('returns a GmailProfile with correct properties for valid input', () => {
    const profile = GmailProfile.create('user@example.com', 100, 50);
    expect(profile.emailAddress).toBe('user@example.com');
    expect(profile.messagesTotal).toBe(100);
    expect(profile.threadsTotal).toBe(50);
  });

  it('accepts zero values for messagesTotal and threadsTotal', () => {
    const profile = GmailProfile.create('user@example.com', 0, 0);
    expect(profile.messagesTotal).toBe(0);
    expect(profile.threadsTotal).toBe(0);
  });

  it('throws InvalidGmailProfileError for empty emailAddress', () => {
    expect(() => GmailProfile.create('', 0, 0)).toThrow(
      InvalidGmailProfileError,
    );
  });

  it('throws InvalidGmailProfileError for whitespace-only emailAddress', () => {
    expect(() => GmailProfile.create('   ', 0, 0)).toThrow(
      InvalidGmailProfileError,
    );
  });

  it('throws InvalidGmailProfileError for negative messagesTotal', () => {
    expect(() => GmailProfile.create('user@example.com', -1, 0)).toThrow(
      InvalidGmailProfileError,
    );
  });

  it('throws InvalidGmailProfileError for negative threadsTotal', () => {
    expect(() => GmailProfile.create('user@example.com', 0, -1)).toThrow(
      InvalidGmailProfileError,
    );
  });

  it('throws InvalidGmailProfileError for non-integer messagesTotal', () => {
    expect(() => GmailProfile.create('user@example.com', 1.5, 0)).toThrow(
      InvalidGmailProfileError,
    );
  });

  it('throws InvalidGmailProfileError for non-integer threadsTotal', () => {
    expect(() => GmailProfile.create('user@example.com', 0, 2.7)).toThrow(
      InvalidGmailProfileError,
    );
  });
});

describe('GmailProfile.equals()', () => {
  it('returns true for profiles with the same data', () => {
    const a = GmailProfile.create('user@example.com', 100, 50);
    const b = GmailProfile.create('user@example.com', 100, 50);
    expect(a.equals(b)).toBe(true);
  });

  it('returns false for profiles with different emailAddress', () => {
    const a = GmailProfile.create('a@example.com', 100, 50);
    const b = GmailProfile.create('b@example.com', 100, 50);
    expect(a.equals(b)).toBe(false);
  });

  it('returns false for profiles with different messagesTotal', () => {
    const a = GmailProfile.create('user@example.com', 100, 50);
    const b = GmailProfile.create('user@example.com', 200, 50);
    expect(a.equals(b)).toBe(false);
  });

  it('returns false for profiles with different threadsTotal', () => {
    const a = GmailProfile.create('user@example.com', 100, 50);
    const b = GmailProfile.create('user@example.com', 100, 75);
    expect(a.equals(b)).toBe(false);
  });
});
