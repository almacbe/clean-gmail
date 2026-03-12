// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  readCache,
  writeCache,
  clearCache,
  clearAllScanCache,
  CACHE_KEYS,
  CACHE_TTL_MS,
} from '@/shared/utils/scanCache';

describe('scanCache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('readCache', () => {
    it('returns null when key is not in localStorage', () => {
      expect(readCache('missing-key')).toBeNull();
    });

    it('returns stored data when entry is present and within TTL', () => {
      const data = { emails: [] };
      writeCache('test-key', data);
      expect(readCache('test-key')).toEqual(data);
    });

    it('returns null and removes entry when cache is expired', () => {
      vi.useFakeTimers();
      const data = { emails: [] };
      writeCache('test-key', data);

      vi.advanceTimersByTime(CACHE_TTL_MS + 1);

      expect(readCache('test-key')).toBeNull();
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('returns null when localStorage contains malformed JSON', () => {
      localStorage.setItem('bad-key', 'not-valid-json{{{');
      expect(readCache('bad-key')).toBeNull();
    });

    it('returns the data (not the wrapper) from a valid entry', () => {
      const data = { count: 42, name: 'test' };
      writeCache('typed-key', data);
      const result = readCache<typeof data>('typed-key');
      expect(result?.count).toBe(42);
      expect(result?.name).toBe('test');
    });
  });

  describe('writeCache', () => {
    it('stores a JSON string with a cachedAt timestamp', () => {
      vi.useFakeTimers();
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);

      writeCache('write-key', { foo: 'bar' });

      const raw = localStorage.getItem('write-key');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as { data: unknown; cachedAt: number };
      expect(parsed.cachedAt).toBe(now);
      expect(parsed.data).toEqual({ foo: 'bar' });
    });
  });

  describe('clearCache', () => {
    it('removes a specific key from localStorage', () => {
      writeCache('to-clear', { x: 1 });
      expect(localStorage.getItem('to-clear')).not.toBeNull();

      clearCache('to-clear');

      expect(localStorage.getItem('to-clear')).toBeNull();
    });

    it('does not throw when key does not exist', () => {
      expect(() => clearCache('non-existent')).not.toThrow();
    });
  });

  describe('clearAllScanCache', () => {
    it('removes all known scan cache keys', () => {
      writeCache(CACHE_KEYS.LARGE_EMAILS, { emails: [] });
      writeCache(CACHE_KEYS.PROMOTIONS, { emails: [] });
      writeCache(CACHE_KEYS.SOCIAL, { emails: [] });
      writeCache(CACHE_KEYS.oldEmails('1y'), { emails: [] });
      writeCache(CACHE_KEYS.oldEmails('2y'), { emails: [] });
      writeCache(CACHE_KEYS.summary('1y'), { largeEmails: {} });

      clearAllScanCache();

      expect(localStorage.getItem(CACHE_KEYS.LARGE_EMAILS)).toBeNull();
      expect(localStorage.getItem(CACHE_KEYS.PROMOTIONS)).toBeNull();
      expect(localStorage.getItem(CACHE_KEYS.SOCIAL)).toBeNull();
      expect(localStorage.getItem(CACHE_KEYS.oldEmails('1y'))).toBeNull();
      expect(localStorage.getItem(CACHE_KEYS.oldEmails('2y'))).toBeNull();
      expect(localStorage.getItem(CACHE_KEYS.summary('1y'))).toBeNull();
    });
  });

  describe('CACHE_KEYS', () => {
    it('old-emails key includes the olderThan threshold', () => {
      expect(CACHE_KEYS.oldEmails('1y')).toBe('scan:old-emails:1y');
      expect(CACHE_KEYS.oldEmails('2y')).toBe('scan:old-emails:2y');
    });

    it('summary key includes the olderThan threshold', () => {
      expect(CACHE_KEYS.summary('1y')).toBe('scan:summary:1y');
      expect(CACHE_KEYS.summary('6m')).toBe('scan:summary:6m');
    });

    it('different thresholds produce different cache keys', () => {
      expect(CACHE_KEYS.oldEmails('1y')).not.toBe(CACHE_KEYS.oldEmails('2y'));
    });

    it('switching threshold gives a separate cache slot', () => {
      writeCache(CACHE_KEYS.oldEmails('1y'), { emails: [{ id: '1y-data' }] });

      const result2y = readCache(CACHE_KEYS.oldEmails('2y'));
      expect(result2y).toBeNull();

      const result1y = readCache<{ emails: { id: string }[] }>(
        CACHE_KEYS.oldEmails('1y'),
      );
      expect(result1y?.emails[0].id).toBe('1y-data');
    });
  });
});
