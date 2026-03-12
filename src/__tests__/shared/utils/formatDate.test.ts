import { describe, it, expect } from 'vitest';
import { formatDate } from '@/shared/utils/formatDate';

describe('formatDate', () => {
  it('formats a valid ISO string to a readable date', () => {
    const result = formatDate('2024-01-10T08:00:00.000Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/10/);
    expect(result).toMatch(/2024/);
  });

  it('returns empty string for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('returns empty string for an empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('handles ISO strings with different timezone offsets', () => {
    const result = formatDate('2025-06-15T00:00:00.000Z');
    expect(result).toMatch(/2025/);
  });
});
