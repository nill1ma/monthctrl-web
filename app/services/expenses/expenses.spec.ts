import {
  getExpenses,
  getExpenseByReference,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  deleteExpensesByReference,
} from './expenses';

// ── Supabase mock ────────────────────────────────────────────────────────────
const mockSelect = jest.fn();
const mockEq    = jest.fn();
const mockIn    = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockFrom  = jest.fn();

const mockGetUser = jest.fn();

const supabaseMock = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

jest.mock('@/app/lib/supabase', () => ({
  createClient: jest.fn(() => Promise.resolve(supabaseMock)),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
const authUser = { id: 'user-1' };

function setupAuth(user = authUser, authError: Error | null = null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: authError });
}

function buildChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: Record<string, jest.Mock> = {};

  const methods = ['select', 'eq', 'in', 'single', 'insert', 'update', 'delete'];
  methods.forEach((m) => {
    chain[m] = overrides[m] ?? jest.fn().mockReturnValue(chain);
  });

  // terminal: returning { data, error }
  const terminal = overrides['__terminal'] ?? { data: null, error: null };

  // Make the last call in a typical chain resolve the terminal
  methods.forEach((m) => {
    chain[m].mockReturnValue(chain);
  });

  return { chain, terminal };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('expenses service', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getExpenses ──────────────────────────────────────────────────────────
  describe('getExpenses', () => {
    it('returns data when authenticated', async () => {
      setupAuth();
      const rows = [{ id: '1', reference: '2024-01', value: 100 }];
      const eqMock = jest.fn().mockResolvedValue({ data: rows, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const result = await getExpenses();
      expect(result).toEqual(rows);
    });

    it('throws when not authenticated', async () => {
      setupAuth(null as any, new Error('no auth'));
      await expect(getExpenses()).rejects.toThrow('Usuário não autenticado');
    });

    it('throws when supabase query errors', async () => {
      setupAuth();
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'db error' } });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ select: selectMock });

      await expect(getExpenses()).rejects.toEqual('db error');
    });
  });

  // ── getExpenseByReference ────────────────────────────────────────────────
  describe('getExpenseByReference', () => {
    it('returns filtered data', async () => {
      setupAuth();
      const rows = [{ id: '1', value: 50, destination: 'Aluguel', currency: 'BRL' }];
      const eq2 = jest.fn().mockResolvedValue({ data: rows, error: null });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const selectMock = jest.fn().mockReturnValue({ eq: eq1 });
      mockFrom.mockReturnValue({ select: selectMock });

      const result = await getExpenseByReference('2024-01');
      expect(result).toEqual(rows);
    });

    it('throws on query error', async () => {
      setupAuth();
      const eq2 = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const selectMock = jest.fn().mockReturnValue({ eq: eq1 });
      mockFrom.mockReturnValue({ select: selectMock });

      await expect(getExpenseByReference('2024-01')).rejects.toEqual('err');
    });
  });

  // ── getExpenseById ───────────────────────────────────────────────────────
  describe('getExpenseById', () => {
    it('returns single expense', async () => {
      setupAuth();
      const row = { id: 'e1', destination: 'Net', value: 120, reference: '2024-01' };
      const singleMock = jest.fn().mockResolvedValue({ data: row, error: null });
      const eq2 = jest.fn().mockReturnValue({ single: singleMock });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const selectMock = jest.fn().mockReturnValue({ eq: eq1 });
      mockFrom.mockReturnValue({ select: selectMock });

      const result = await getExpenseById('e1');
      expect(result).toEqual(row);
    });

    it('throws on error', async () => {
      setupAuth();
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'nf' } });
      const eq2 = jest.fn().mockReturnValue({ single: singleMock });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const selectMock = jest.fn().mockReturnValue({ eq: eq1 });
      mockFrom.mockReturnValue({ select: selectMock });

      await expect(getExpenseById('e1')).rejects.toEqual('nf');
    });
  });

  // ── createExpense ────────────────────────────────────────────────────────
  describe('createExpense', () => {
    it('creates and returns new expense', async () => {
      setupAuth();
      const created = { id: 'new', destination: 'Luz', value: 80, reference: '2024-01', user_id: 'user-1' };
      const singleMock = jest.fn().mockResolvedValue({ data: created, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockFrom.mockReturnValue({ insert: insertMock });

      const result = await createExpense({ destination: 'Luz', value: 80, reference: '2024-01' });
      expect(result).toEqual(created);
    });

    it('throws on insert error', async () => {
      setupAuth();
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'insert fail' } });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockFrom.mockReturnValue({ insert: insertMock });

      await expect(createExpense({ destination: 'Luz', value: 80, reference: '2024-01' })).rejects.toThrow('insert fail');
    });
  });

  // ── updateExpense ────────────────────────────────────────────────────────
  describe('updateExpense', () => {
    it('updates and returns updated expense', async () => {
      setupAuth();
      const updated = [{ id: 'e1', destination: 'Agua', value: 60, reference: '2024-01', user_id: 'user-1' }];
      const selectMock = jest.fn().mockResolvedValue({ data: updated, error: null });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ update: updateMock });

      const result = await updateExpense({ id: 'e1', destination: 'Agua', value: 60, reference: '2024-01' });
      expect(result).toEqual(updated);
    });

    it('throws on update error', async () => {
      setupAuth();
      const selectMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'upd fail' } });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ update: updateMock });

      await expect(updateExpense({ id: 'e1', destination: 'Agua', value: 60, reference: '2024-01' })).rejects.toThrow('upd fail');
    });
  });

  // ── deleteExpense ────────────────────────────────────────────────────────
  describe('deleteExpense', () => {
    it('deletes and returns data', async () => {
      setupAuth();
      const eqMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ delete: deleteMock });

      const result = await deleteExpense('e1');
      expect(result).toEqual([]);
    });

    it('throws on delete error', async () => {
      setupAuth();
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'del fail' } });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ delete: deleteMock });

      await expect(deleteExpense('e1')).rejects.toThrow('del fail');
    });
  });

  // ── deleteExpensesByReference ────────────────────────────────────────────
  describe('deleteExpensesByReference', () => {
    it('deletes by reference without error', async () => {
      setupAuth();
      const eq2 = jest.fn().mockResolvedValue({ error: null });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: eq1 });
      mockFrom.mockReturnValue({ delete: deleteMock });

      await expect(deleteExpensesByReference('2024-01')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      setupAuth();
      const eq2 = jest.fn().mockResolvedValue({ error: { message: 'ref del fail' } });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: eq1 });
      mockFrom.mockReturnValue({ delete: deleteMock });

      await expect(deleteExpensesByReference('2024-01')).rejects.toThrow('ref del fail');
    });
  });
});
