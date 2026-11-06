import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useIncomingsExpensesTransactionsList } from './useIncomingsExpensesTransactionsList';

const mockGetTransactions = jest.fn();

jest.mock('@/app/services/incomings_expenses_transactions/incomings_expenses_transactions', () => ({
  getIncomingsExpensesTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('useIncomingsExpensesTransactionsList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns data for a valid page', async () => {
    const response = {
      data: [{ reference: '2024-01', currencies: [] }],
      totalElements: 1,
    };
    mockGetTransactions.mockResolvedValue(response);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomingsExpensesTransactionsList(1), {
      wrapper: wrapper(qc),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(response);
    expect(mockGetTransactions).toHaveBeenCalledWith(1);
  });

  it('is disabled when page is 0', () => {
    const qc = makeClient();
    const { result } = renderHook(() => useIncomingsExpensesTransactionsList(0), {
      wrapper: wrapper(qc),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGetTransactions).not.toHaveBeenCalled();
  });

  it('passes page number to service', async () => {
    mockGetTransactions.mockResolvedValue({ data: [], totalElements: 0 });

    const qc = makeClient();
    renderHook(() => useIncomingsExpensesTransactionsList(3), { wrapper: wrapper(qc) });

    await waitFor(() => expect(mockGetTransactions).toHaveBeenCalledWith(3));
  });
});
