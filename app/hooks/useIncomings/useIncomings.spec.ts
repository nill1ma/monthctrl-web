import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useIncomings } from './useIncomings';

// ── Service mocks ────────────────────────────────────────────────────────────
const mockGetIncomingByReference    = jest.fn();
const mockGetIncomingsById          = jest.fn();
const mockCreateIncoming            = jest.fn();
const mockUpdateIncoming            = jest.fn();
const mockDeleteIncoming            = jest.fn();
const mockDeleteIncomingsByRef      = jest.fn();

jest.mock('@/app/services/incomings/incomings', () => ({
  getIncomingByReference:     (...args: unknown[]) => mockGetIncomingByReference(...args),
  getIncomingsById:           (...args: unknown[]) => mockGetIncomingsById(...args),
  createIncoming:             (...args: unknown[]) => mockCreateIncoming(...args),
  updateIncoming:             (...args: unknown[]) => mockUpdateIncoming(...args),
  deleteIncoming:             (...args: unknown[]) => mockDeleteIncoming(...args),
  deleteIncomingsByReference: (...args: unknown[]) => mockDeleteIncomingsByRef(...args),
}));

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

describe('useIncomings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches incomings by reference', async () => {
    const rows = [{ id: 'i1', value: 5000, origin: 'Salário', currency: 'BRL' }];
    mockGetIncomingByReference.mockResolvedValue(rows);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomings('2024-01'), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(rows);
  });

  it('does not fetch when reference is undefined', () => {
    const qc = makeClient();
    const { result } = renderHook(() => useIncomings(), { wrapper: wrapper(qc) });

    expect(result.current.isLoading).toBe(false);
    expect(mockGetIncomingByReference).not.toHaveBeenCalled();
  });

  it('fetches single incoming by id', async () => {
    const row = { id: 'i1', origin: 'Salário', value: 5000, reference: '2024-01' };
    mockGetIncomingsById.mockResolvedValue(row);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomings(undefined, 'i1'), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isLoadingSingleIncoming).toBe(false));
    expect(result.current.dataSingleIncoming).toEqual(row);
  });

  it('calls createMutation', async () => {
    const created = { id: 'new', origin: 'Bônus', value: 500, reference: '2024-01' };
    mockCreateIncoming.mockResolvedValue(created);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomings(), { wrapper: wrapper(qc) });

    let res: unknown;
    await act(async () => {
      res = await result.current.createMutation({ origin: 'Bônus', value: 500, reference: '2024-01' });
    });
    expect(res).toEqual(created);
  });

  it('calls updateMutation', async () => {
    const updated = [{ id: 'i1', origin: 'Salário', value: 5500, reference: '2024-01', user_id: 'u1' }];
    mockUpdateIncoming.mockResolvedValue(updated);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomings(), { wrapper: wrapper(qc) });

    let res: unknown;
    await act(async () => {
      res = await result.current.updateMutation({ id: 'i1', origin: 'Salário', value: 5500, reference: '2024-01' });
    });
    expect(res).toEqual(updated);
  });

  it('calls deleteMutation', async () => {
    mockDeleteIncoming.mockResolvedValue([]);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomings(), { wrapper: wrapper(qc) });

    act(() => { result.current.deleteMutation('i1'); });
    await waitFor(() => expect(mockDeleteIncoming).toHaveBeenCalledWith('i1', expect.anything()));
  });

  it('calls deleteByReferenceMutation', async () => {
    mockDeleteIncomingsByRef.mockResolvedValue(undefined);

    const qc = makeClient();
    const { result } = renderHook(() => useIncomings(), { wrapper: wrapper(qc) });

    await act(async () => { await result.current.deleteByReferenceMutation('2024-01'); });
    expect(mockDeleteIncomingsByRef).toHaveBeenCalledWith('2024-01', expect.anything());
  });
});
