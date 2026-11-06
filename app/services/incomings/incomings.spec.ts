import {
  getIncomings,
  getIncomingsById,
  getIncomingByReference,
  createIncoming,
  updateIncoming,
  deleteIncoming,
  deleteIncomingsByReference,
} from './incomings';

const mockGetUser = jest.fn();
const mockFrom   = jest.fn();

const supabaseMock = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

jest.mock('@/app/lib/supabase', () => ({
  createClient: jest.fn(() => Promise.resolve(supabaseMock)),
}));

const authUser = { id: 'user-1' };

function setupAuth(user = authUser, authError: Error | null = null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: authError });
}

describe('incomings service', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getIncomings ─────────────────────────────────────────────────────────
  describe('getIncomings', () => {
    it('returns data when authenticated', async () => {
      setupAuth();
      const rows = [{ id: '1', reference: '2024-01', value: 1000 }];
      const eqMock = jest.fn().mockResolvedValue({ data: rows, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqMock }) });

      expect(await getIncomings()).toEqual(rows);
    });

    it('throws when not authenticated', async () => {
      setupAuth(null as any, new Error('no auth'));
      await expect(getIncomings()).rejects.toThrow('Usuário não autenticado');
    });

    it('throws on query error', async () => {
      setupAuth();
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'db err' } });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqMock }) });
      await expect(getIncomings()).rejects.toEqual('db err');
    });
  });

  // ── getIncomingsById ─────────────────────────────────────────────────────
  describe('getIncomingsById', () => {
    it('returns single incoming', async () => {
      setupAuth();
      const row = { id: 'i1', origin: 'Salário', value: 5000, reference: '2024-01' };
      const singleMock = jest.fn().mockResolvedValue({ data: row, error: null });
      const eq2 = jest.fn().mockReturnValue({ single: singleMock });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eq1 }) });

      expect(await getIncomingsById('i1')).toEqual(row);
    });

    it('throws on error', async () => {
      setupAuth();
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'nf' } });
      const eq2 = jest.fn().mockReturnValue({ single: singleMock });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eq1 }) });

      await expect(getIncomingsById('i1')).rejects.toEqual('nf');
    });
  });

  // ── getIncomingByReference ───────────────────────────────────────────────
  describe('getIncomingByReference', () => {
    it('returns filtered data', async () => {
      setupAuth();
      const rows = [{ id: 'i1', value: 500, origin: 'Freelance', currency: 'BRL' }];
      const eq2 = jest.fn().mockResolvedValue({ data: rows, error: null });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eq1 }) });

      expect(await getIncomingByReference('2024-01')).toEqual(rows);
    });

    it('throws on query error', async () => {
      setupAuth();
      const eq2 = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eq1 }) });

      await expect(getIncomingByReference('2024-01')).rejects.toEqual('err');
    });
  });

  // ── createIncoming ───────────────────────────────────────────────────────
  describe('createIncoming', () => {
    it('creates and returns incoming', async () => {
      setupAuth();
      const created = { id: 'new', origin: 'Bônus', value: 500, reference: '2024-01', user_id: 'user-1' };
      const singleMock = jest.fn().mockResolvedValue({ data: created, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      mockFrom.mockReturnValue({ insert: jest.fn().mockReturnValue({ select: selectMock }) });

      expect(await createIncoming({ origin: 'Bônus', value: 500, reference: '2024-01' })).toEqual(created);
    });

    it('throws on insert error', async () => {
      setupAuth();
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'insert fail' } });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      mockFrom.mockReturnValue({ insert: jest.fn().mockReturnValue({ select: selectMock }) });

      await expect(createIncoming({ origin: 'Bônus', value: 500, reference: '2024-01' })).rejects.toThrow('insert fail');
    });
  });

  // ── updateIncoming ───────────────────────────────────────────────────────
  describe('updateIncoming', () => {
    it('updates and returns data', async () => {
      setupAuth();
      const updated = [{ id: 'i1', origin: 'Salário', value: 5500, reference: '2024-01', user_id: 'user-1' }];
      const selectMock = jest.fn().mockResolvedValue({ data: updated, error: null });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: eqMock }) });

      expect(await updateIncoming({ id: 'i1', origin: 'Salário', value: 5500, reference: '2024-01' })).toEqual(updated);
    });

    it('throws on error', async () => {
      setupAuth();
      const selectMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'upd fail' } });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: eqMock }) });

      await expect(updateIncoming({ id: 'i1', origin: 'Salário', value: 5500, reference: '2024-01' })).rejects.toThrow('upd fail');
    });
  });

  // ── deleteIncoming ───────────────────────────────────────────────────────
  describe('deleteIncoming', () => {
    it('deletes and returns data', async () => {
      setupAuth();
      const eqMock = jest.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eqMock }) });

      expect(await deleteIncoming('i1')).toEqual([]);
    });

    it('throws on error', async () => {
      setupAuth();
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'del fail' } });
      mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eqMock }) });

      await expect(deleteIncoming('i1')).rejects.toThrow('del fail');
    });
  });

  // ── deleteIncomingsByReference ───────────────────────────────────────────
  describe('deleteIncomingsByReference', () => {
    it('resolves without error', async () => {
      setupAuth();
      const eq2 = jest.fn().mockResolvedValue({ error: null });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eq1 }) });

      await expect(deleteIncomingsByReference('2024-01')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      setupAuth();
      const eq2 = jest.fn().mockResolvedValue({ error: { message: 'ref del fail' } });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eq1 }) });

      await expect(deleteIncomingsByReference('2024-01')).rejects.toThrow('ref del fail');
    });
  });
});
