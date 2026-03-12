// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLargeEmailsScan } from '@/presentation/hooks/useLargeEmailsScan';
import * as scanCache from '@/shared/utils/scanCache';

const MOCK_DATA = {
  emails: [
    {
      id: '1',
      sender: 'a@b.com',
      subject: 'Hi',
      date: '2024-01-01T00:00:00Z',
      sizeEstimate: 6_000_000,
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

function mockFetchError(status: number, body: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

function mockFetchNetworkError(message: string) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(message)));
}

describe('useLargeEmailsScan', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading status when cache is empty', () => {
    mockFetchOk(MOCK_DATA);
    const { result } = renderHook(() => useLargeEmailsScan());
    expect(result.current.status).toBe('loading');
  });

  it('returns cached data immediately when cache is valid (no fetch call)', async () => {
    scanCache.writeCache(scanCache.CACHE_KEYS.LARGE_EMAILS, MOCK_DATA);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useLargeEmailsScan());

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchSpy).not.toHaveBeenCalled();
    if (result.current.status === 'success') {
      expect(result.current.data).toEqual(MOCK_DATA);
    }
  });

  it('fetches from API and writes to cache when cache is empty', async () => {
    mockFetchOk(MOCK_DATA);
    const writeSpy = vi.spyOn(scanCache, 'writeCache');

    const { result } = renderHook(() => useLargeEmailsScan());

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetch).toHaveBeenCalledWith('/api/scan/large-emails');
    expect(writeSpy).toHaveBeenCalledWith(
      scanCache.CACHE_KEYS.LARGE_EMAILS,
      MOCK_DATA,
    );
  });

  it('returns success with data after successful fetch', async () => {
    mockFetchOk(MOCK_DATA);

    const { result } = renderHook(() => useLargeEmailsScan());

    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status === 'success') {
      expect(result.current.data).toEqual(MOCK_DATA);
    }
  });

  it('returns error status when fetch returns non-OK response', async () => {
    mockFetchError(500, { error: 'Server error' });

    const { result } = renderHook(() => useLargeEmailsScan());

    await waitFor(() => expect(result.current.status).toBe('error'));

    if (result.current.status === 'error') {
      expect(result.current.message).toBe('Server error');
    }
  });

  it('uses fallback message when error response has no body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no body')),
      }),
    );

    const { result } = renderHook(() => useLargeEmailsScan());

    await waitFor(() => expect(result.current.status).toBe('error'));

    if (result.current.status === 'error') {
      expect(result.current.message).toBe('Failed to scan large emails');
    }
  });

  it('returns error status when fetch throws a network error', async () => {
    mockFetchNetworkError('Network failure');

    const { result } = renderHook(() => useLargeEmailsScan());

    await waitFor(() => expect(result.current.status).toBe('error'));

    if (result.current.status === 'error') {
      expect(result.current.message).toBe('Network failure');
    }
  });

  it('re-fetches fresh data when refreshKey changes (cache was cleared)', async () => {
    const newData = { emails: [] };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_DATA),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newData),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ key }: { key: number }) => useLargeEmailsScan(key),
      { initialProps: { key: 0 } },
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    // Simulate Rescan: clear cache then increment key
    scanCache.clearAllScanCache();

    act(() => {
      rerender({ key: 1 });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status === 'success') {
      expect(result.current.data).toEqual(newData);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
