import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExpenses } from './useExpenses';

// ── Service mocks ────────────────────────────────────────────────────────────
const mockGetExpenseByReference = jest.fn();
const mockGetExpenseById         = jest.fn();
const mockCreateExpense          = jest.fn();
const mockUpdateExpense          = jest.fn();
const mockDeleteExpense          = jest.fn();
const mockDeleteExpensesByRef    = jest.fn();

jest.mock('@/app/services/expenses/expenses', () => ({
  getExpenseByReference:    (...args: unknown[]) => mockGetExpenseByReference(...args),
  getExpenseById:           (...args: unknown[]) => mockGetExpenseById(...args),
  createExpense:            (...args: unknown[]) => mockCreateExpense(...args),
  updateExpense:            (...args: unknown[]) => mockUpdateExpense(...args),
  deleteExpense:            (...args: unknown[]) => mockDeleteExpense(...args),
  deleteExpensesByReference:(...args: unknown[]) => mockDeleteExpensesByRef(...args),
}));

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

describe('useExpenses', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches expenses by reference', async () => {
    const rows = [{ id: 'e1', value: 100, destination: 'Aluguel', currency: 'BRL' }];
    mockGetExpenseByReference.mockResolvedValue(rows);

    const qc = makeClient();
    const { result } = renderHook(() => useExpenses('2024-01'), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(rows);
  });

  it('does not fetch when reference is undefined', () => {
    const qc = makeClient();
    const { result } = renderHook(() => useExpenses(), { wrapper: wrapper(qc) });

    expect(result.current.isLoading).toBe(false);
    expect(mockGetExpenseByReference).not.toHaveBeenCalled();
  });

  it('fetches single expense by id', async () => {
    const row = { id: 'e1', destination: 'Net', value: 120, reference: '2024-01' };
    mockGetExpenseById.mockResolvedValue(row);

    const qc = makeClient();
    const { result } = renderHook(() => useExpenses(undefined, 'e1'), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isLoadingSingleExpense).toBe(false));
    expect(result.current.dataSingleExpense).toEqual(row);
  });

  it('calls createMutation', async () => {
    const created = { id: 'new', destination: 'Luz', value: 80, reference: '2024-01' };
    mockCreateExpense.mockResolvedValue(created);

    const qc = makeClient();
    const { result } = renderHook(() => useExpenses(), { wrapper: wrapper(qc) });

    let res: unknown;
    await act(async () => {
      res = await result.current.createMutation({ destination: 'Luz', value: 80, reference: '2024-01' });
    });
    expect(res).toEqual(created);
  });

  it('calls updateMutation', async () => {
    const updated = [{ id: 'e1', destination: 'Agua', value: 60, reference: '2024-01', user_id: 'u1' }];
    mockUpdateExpense.mockResolvedValue(updated);

    const qc = makeClient();
    const { result } = renderHook(() => useExpenses(), { wrapper: wrapper(qc) });

    let res: unknown;
    await act(async () => {
      res = await result.current.updateMutation({ id: 'e1', destination: 'Agua', value: 60, reference: '2024-01' });
    });
    expect(res).toEqual(updated);
  });

  it('calls deleteMutation', async () => {
    mockDeleteExpense.mockResolvedValue([]);

    const qc = makeClient();
    const { result } = renderHook(() => useExpenses(), { wrapper: wrapper(qc) });

    act(() => { result.current.deleteMutation('e1'); });
    await waitFor(() => expect(mockDeleteExpense).toHaveBeenCalledWith('e1', expect.anything()));
  });

  it('calls deleteByReferenceMutation', async () => {
    mockDeleteExpensesByRef.mockResolvedValue(undefined);

    const qc = makeClient();
    const { result } = renderHook(() => useExpenses(), { wrapper: wrapper(qc) });

    await act(async () => { await result.current.deleteByReferenceMutation('2024-01'); });
    expect(mockDeleteExpensesByRef).toHaveBeenCalledWith('2024-01', expect.anything());
  });
});
