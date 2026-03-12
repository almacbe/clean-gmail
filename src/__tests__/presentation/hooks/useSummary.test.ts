// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSummary } from '@/presentation/hooks/useSummary';
import * as scanCache from '@/shared/utils/scanCache';

const MOCK_SUMMARY = {
  largeEmails: { count: 3, totalSizeBytes: 24_000_000 },
  promotions: { count: 120, totalSizeBytes: 15_000_000 },
  social: { count: 45, totalSizeBytes: 8_000_000 },
  oldEmails: { count: 200, totalSizeBytes: 50_000_000 },
};

function mockFetchOk(data: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

describe('useSummary', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading status when cache is empty', () => {
    mockFetchOk(MOCK_SUMMARY);
    const { result } = renderHook(() => useSummary('1y'));
    expect(result.current.status).toBe('loading');
  });

  it('returns cached data when cache is valid (no fetch call)', async () => {
    scanCache.writeCache(scanCache.CACHE_KEYS.summary('1y'), MOCK_SUMMARY);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useSummary('1y'));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchSpy).not.toHaveBeenCalled();
    if (result.current.status === 'success') {
      expect(result.current.data).toEqual(MOCK_SUMMARY);
    }
  });

  it('fetches with correct olderThan param and writes to cache', async () => {
    mockFetchOk(MOCK_SUMMARY);
    const writeSpy = vi.spyOn(scanCache, 'writeCache');

    const { result } = renderHook(() => useSummary('1y'));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetch).toHaveBeenCalledWith('/api/scan/summary?olderThan=1y');
    expect(writeSpy).toHaveBeenCalledWith(
      scanCache.CACHE_KEYS.summary('1y'),
      MOCK_SUMMARY,
    );
  });

  it('returns error when API returns non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Summary failed' }),
      }),
    );

    const { result } = renderHook(() => useSummary('1y'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    if (result.current.status === 'error') {
      expect(result.current.message).toBe('Summary failed');
    }
  });

  it('uses separate cache key per threshold', async () => {
    scanCache.writeCache(scanCache.CACHE_KEYS.summary('1y'), MOCK_SUMMARY);
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_SUMMARY),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { result: result1y } = renderHook(() => useSummary('1y'));
    await waitFor(() => expect(result1y.current.status).toBe('success'));
    expect(fetchSpy).not.toHaveBeenCalled();

    const { result: result2y } = renderHook(() => useSummary('2y'));
    await waitFor(() => expect(result2y.current.status).toBe('success'));
    expect(fetchSpy).toHaveBeenCalledWith('/api/scan/summary?olderThan=2y');
  });

  it('re-fetches when refreshKey changes and cache was cleared', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_SUMMARY),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_SUMMARY),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ key }: { key: number }) => useSummary('1y', key),
      { initialProps: { key: 0 } },
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    scanCache.clearAllScanCache();

    act(() => rerender({ key: 1 }));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
