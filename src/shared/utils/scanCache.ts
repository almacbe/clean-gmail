export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CacheEntry<T> = {
  data: T;
  cachedAt: number;
};

export const CACHE_KEYS = {
  LARGE_EMAILS: 'scan:large-emails',
  PROMOTIONS: 'scan:promotions',
  SOCIAL: 'scan:social',
  oldEmails: (olderThan: string): string => `scan:old-emails:${olderThan}`,
  summary: (olderThan: string): string => `scan:summary:${olderThan}`,
} as const;

export function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore quota / private-browsing errors
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function clearAllScanCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEYS.LARGE_EMAILS);
  localStorage.removeItem(CACHE_KEYS.PROMOTIONS);
  localStorage.removeItem(CACHE_KEYS.SOCIAL);
  const allThresholds = ['6m', '1y', '2y', '5y'];
  for (const t of allThresholds) {
    localStorage.removeItem(CACHE_KEYS.oldEmails(t));
    localStorage.removeItem(CACHE_KEYS.summary(t));
  }
}
