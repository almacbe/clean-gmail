// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOldEmailsScan } from '@/presentation/hooks/useOldEmailsScan';
import * as scanCache from '@/shared/utils/scanCache';

const MOCK_DATA = {
  emails: [
    {
      id: '1',
      sender: 'a@b.com',
      subject: 'Old',
      date: '2019-01-01T00:00:00Z',
      sizeEstimate: 500_000,
    },
  ],
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

describe('useOldEmailsScan', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading status when cache is empty', () => {
    mockFetchOk(MOCK_DATA);
    const { result } = renderHook(() => useOldEmailsScan('1y'));
    expect(result.current.status).toBe('loading');
  });

  it('returns cached data when cache is valid (no fetch call)', async () => {
    scanCache.writeCache(scanCache.CACHE_KEYS.oldEmails('1y'), MOCK_DATA);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useOldEmailsScan('1y'));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches from API with correct olderThan param and writes to cache', async () => {
    mockFetchOk(MOCK_DATA);
    const writeSpy = vi.spyOn(scanCache, 'writeCache');

    const { result } = renderHook(() => useOldEmailsScan('2y'));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetch).toHaveBeenCalledWith('/api/scan/old-emails?olderThan=2y');
    expect(writeSpy).toHaveBeenCalledWith(
      scanCache.CACHE_KEYS.oldEmails('2y'),
      MOCK_DATA,
    );
  });

  it('uses separate cache keys for different thresholds', async () => {
    scanCache.writeCache(scanCache.CACHE_KEYS.oldEmails('1y'), {
      emails: [{ id: '1y' }],
    });
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ emails: [] }),
      });
    vi.stubGlobal('fetch', fetchSpy);

    // '1y' should use cache (no fetch)
    const { result: result1y } = renderHook(() => useOldEmailsScan('1y'));
    await waitFor(() => expect(result1y.current.status).toBe('success'));
    expect(fetchSpy).not.toHaveBeenCalled();

    // '2y' should fetch (cache miss)
    const { result: result2y } = renderHook(() => useOldEmailsScan('2y'));
    await waitFor(() => expect(result2y.current.status).toBe('success'));
    expect(fetchSpy).toHaveBeenCalledWith('/api/scan/old-emails?olderThan=2y');
  });

  it('re-fetches when threshold changes (new cache key)', async () => {
    mockFetchOk(MOCK_DATA);

    const { result, rerender } = renderHook(
      ({ threshold }: { threshold: '1y' | '2y' }) =>
        useOldEmailsScan(threshold),
      { initialProps: { threshold: '1y' as const } },
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => rerender({ threshold: '2y' }));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetch).toHaveBeenCalledWith('/api/scan/old-emails?olderThan=2y');
  });

  it('re-fetches when refreshKey changes and cache was cleared', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_DATA),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ emails: [] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ key }: { key: number }) => useOldEmailsScan('1y', key),
      { initialProps: { key: 0 } },
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    scanCache.clearAllScanCache();

    act(() => rerender({ key: 1 }));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
