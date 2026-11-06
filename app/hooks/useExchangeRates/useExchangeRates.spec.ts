import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExchangeRates } from './useExchangeRates';

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('useExchangeRates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches rates and returns them', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { USD: 5.0, EUR: 5.5 } }),
    } as Response);

    const qc = makeClient();
    const { result } = renderHook(() => useExchangeRates('BRL', ['USD', 'EUR']), {
      wrapper: wrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ USD: 5.0, EUR: 5.5 });
  });

  it('returns empty object when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    } as Response);

    const qc = makeClient();
    const { result } = renderHook(() => useExchangeRates('BRL', ['USD']), {
      wrapper: wrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({});
  });

  it('is disabled when targets array is empty', () => {
    global.fetch = jest.fn();
    const qc = makeClient();
    const { result } = renderHook(() => useExchangeRates('BRL', []), {
      wrapper: wrapper(qc),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sorts targets for stable query key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { EUR: 5.5, USD: 5.0 } }),
    } as Response);

    const qc = makeClient();
    // Pass in reverse order — should still hit same query key as sorted
    renderHook(() => useExchangeRates('BRL', ['USD', 'EUR']), { wrapper: wrapper(qc) });
    renderHook(() => useExchangeRates('BRL', ['EUR', 'USD']), { wrapper: wrapper(qc) });

    await waitFor(() => expect((fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1));
    // Both hooks share same cache entry — fetch called only once
    expect((fetch as jest.Mock).mock.calls.length).toBe(1);
  });
});
