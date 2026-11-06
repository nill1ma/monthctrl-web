import {
  getIncomingsExpensesTransactions,
  getDetailedTransactionsByReferences,
} from './incomings_expenses_transactions';

// ── Supabase mock ────────────────────────────────────────────────────────────
const mockGetUser = jest.fn();
const mockRpc     = jest.fn();
const mockFrom    = jest.fn();

const supabaseMock = {
  auth: { getUser: mockGetUser },
  rpc: mockRpc,
  from: mockFrom,
};

jest.mock('@/app/lib/supabase', () => ({
  createClient: jest.fn(() => Promise.resolve(supabaseMock)),
}));

const authUser = { id: 'user-1' };
function setupAuth(user = authUser, error: Error | null = null) {
  mockGetUser.mockResolvedValue({ data: { user }, error });
}

// ── getIncomingsExpensesTransactions ─────────────────────────────────────────
describe('getIncomingsExpensesTransactions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when not authenticated', async () => {
    setupAuth(null as any, new Error('no auth'));
    await expect(getIncomingsExpensesTransactions(1)).rejects.toThrow('Usuário não autenticado');
  });

  it('returns empty when rpc returns no rows', async () => {
    setupAuth();
    mockRpc.mockResolvedValue({ data: [], error: null });

    const result = await getIncomingsExpensesTransactions(1);
    expect(result).toEqual({ data: [], totalElements: 0 });
  });

  it('throws when rpc errors', async () => {
    setupAuth();
    const rpcError = new Error('rpc fail');
    mockRpc.mockResolvedValue({ data: null, error: rpcError });

    await expect(getIncomingsExpensesTransactions(1)).rejects.toThrow('rpc fail');
  });

  it('returns grouped data when rpc and grouped query succeed', async () => {
    setupAuth();
    mockRpc.mockResolvedValue({
      data: [
        { reference: '2024-01', total_count: 2 },
        { reference: '2024-02', total_count: 2 },
      ],
      error: null,
    });

    const groupedRows = [
      { reference: '2024-01', currency: 'BRL', incoming_value: 5000, expense_value: 1500, net_income: 3500 },
      { reference: '2024-02', currency: 'USD', incoming_value: 1000, expense_value: 200, net_income: 800 },
    ];

    const inMock  = jest.fn().mockResolvedValue({ data: groupedRows, error: null });
    const eqMock  = jest.fn().mockReturnValue({ in: inMock });
    const selMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selMock });

    const result = await getIncomingsExpensesTransactions(1);

    expect(result.totalElements).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      reference: '2024-01',
      currencies: [{ currency: 'BRL', incoming_value: 5000, expense_value: 1500, net_income: 3500 }],
    });
  });

  it('throws when grouped query errors', async () => {
    setupAuth();
    mockRpc.mockResolvedValue({
      data: [{ reference: '2024-01', total_count: 1 }],
      error: null,
    });

    const inMock  = jest.fn().mockResolvedValue({ data: null, error: new Error('grouped fail') });
    const eqMock  = jest.fn().mockReturnValue({ in: inMock });
    const selMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selMock });

    await expect(getIncomingsExpensesTransactions(1)).rejects.toThrow('grouped fail');
  });

  it('defaults null currency to BRL in grouped rows', async () => {
    setupAuth();
    mockRpc.mockResolvedValue({
      data: [{ reference: '2024-01', total_count: 1 }],
      error: null,
    });

    const groupedRows = [
      { reference: '2024-01', currency: null, incoming_value: null, expense_value: null, net_income: null },
    ];

    const inMock  = jest.fn().mockResolvedValue({ data: groupedRows, error: null });
    const eqMock  = jest.fn().mockReturnValue({ in: inMock });
    const selMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selMock });

    const result = await getIncomingsExpensesTransactions(1);
    expect(result.data[0].currencies[0]).toEqual({
      currency: 'BRL',
      incoming_value: 0,
      expense_value: 0,
      net_income: 0,
    });
  });

  it('skips grouped rows with null reference', async () => {
    setupAuth();
    mockRpc.mockResolvedValue({
      data: [{ reference: '2024-01', total_count: 1 }],
      error: null,
    });

    const groupedRows = [
      { reference: null, currency: 'BRL', incoming_value: 100, expense_value: 50, net_income: 50 },
    ];

    const inMock  = jest.fn().mockResolvedValue({ data: groupedRows, error: null });
    const eqMock  = jest.fn().mockReturnValue({ in: inMock });
    const selMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selMock });

    const result = await getIncomingsExpensesTransactions(1);
    expect(result.data[0].currencies).toHaveLength(0);
  });
});

// ── getDetailedTransactionsByReferences ──────────────────────────────────────
describe('getDetailedTransactionsByReferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns merged incomings and expenses', async () => {
    const incomingsData = [
      { reference: '2024-01', origin: 'Salário', value: 5000, currency: 'BRL' },
    ];
    const expensesData = [
      { reference: '2024-01', destination: 'Aluguel', value: 1500, currency: 'BRL' },
    ];

    // from is called twice — first for 'incomings', then for 'expenses'
    const makeChain = (data: unknown[]) => {
      const inMock  = jest.fn().mockResolvedValue({ data, error: null });
      const eqMock  = jest.fn().mockReturnValue({ in: inMock });
      const selMock = jest.fn().mockReturnValue({ eq: eqMock });
      return { select: selMock };
    };

    mockFrom
      .mockReturnValueOnce(makeChain(incomingsData))
      .mockReturnValueOnce(makeChain(expensesData));

    const result = await getDetailedTransactionsByReferences(['2024-01'], 'user-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ description: 'Salário', type: 'incoming', value: 5000 });
    expect(result[1]).toMatchObject({ description: 'Aluguel', type: 'expense', value: 1500 });
  });

  it('defaults null values to 0 and null currency to BRL', async () => {
    const incomingsData = [{ reference: '2024-01', origin: 'X', value: null, currency: null }];
    const expensesData  = [{ reference: '2024-01', destination: 'Y', value: null, currency: null }];

    const makeChain = (data: unknown[]) => {
      const inMock  = jest.fn().mockResolvedValue({ data, error: null });
      const eqMock  = jest.fn().mockReturnValue({ in: inMock });
      const selMock = jest.fn().mockReturnValue({ eq: eqMock });
      return { select: selMock };
    };

    mockFrom
      .mockReturnValueOnce(makeChain(incomingsData))
      .mockReturnValueOnce(makeChain(expensesData));

    const result = await getDetailedTransactionsByReferences(['2024-01'], 'user-1');
    expect(result[0].value).toBe(0);
    expect(result[0].currency).toBe('BRL');
    expect(result[1].value).toBe(0);
    expect(result[1].currency).toBe('BRL');
  });

  it('throws when incomings query errors', async () => {
    const makeErrorChain = () => {
      const inMock  = jest.fn().mockResolvedValue({ data: null, error: new Error('inc fail') });
      const eqMock  = jest.fn().mockReturnValue({ in: inMock });
      const selMock = jest.fn().mockReturnValue({ eq: eqMock });
      return { select: selMock };
    };
    const makeOkChain = () => {
      const inMock  = jest.fn().mockResolvedValue({ data: [], error: null });
      const eqMock  = jest.fn().mockReturnValue({ in: inMock });
      const selMock = jest.fn().mockReturnValue({ eq: eqMock });
      return { select: selMock };
    };

    mockFrom
      .mockReturnValueOnce(makeErrorChain())
      .mockReturnValueOnce(makeOkChain());

    await expect(getDetailedTransactionsByReferences(['2024-01'], 'user-1')).rejects.toThrow('inc fail');
  });

  it('throws when expenses query errors', async () => {
    const makeOkChain = () => {
      const inMock  = jest.fn().mockResolvedValue({ data: [], error: null });
      const eqMock  = jest.fn().mockReturnValue({ in: inMock });
      const selMock = jest.fn().mockReturnValue({ eq: eqMock });
      return { select: selMock };
    };
    const makeErrorChain = () => {
      const inMock  = jest.fn().mockResolvedValue({ data: null, error: new Error('exp fail') });
      const eqMock  = jest.fn().mockReturnValue({ in: inMock });
      const selMock = jest.fn().mockReturnValue({ eq: eqMock });
      return { select: selMock };
    };

    mockFrom
      .mockReturnValueOnce(makeOkChain())
      .mockReturnValueOnce(makeErrorChain());

    await expect(getDetailedTransactionsByReferences(['2024-01'], 'user-1')).rejects.toThrow('exp fail');
  });
});
