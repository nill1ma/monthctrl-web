import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from './page';
import { useIncomingsExpensesTransactionsList } from '@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList';
import { useIncomings } from '@/app/hooks/useIncomings/useIncomings';
import { useExpenses } from '@/app/hooks/useExpenses/useExpenses';
import { useExchangeRates } from '@/app/hooks/useExchangeRates/useExchangeRates';

// ── Hooks ───────────────────────────────────────────────────────────────────
jest.mock('@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList');
jest.mock('@/app/hooks/useIncomings/useIncomings');
jest.mock('@/app/hooks/useExpenses/useExpenses');
jest.mock('@/app/hooks/useExchangeRates/useExchangeRates');

// ── Navigation / intl ───────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));

// ── UI deps ─────────────────────────────────────────────────────────────────
jest.mock('@/app/components/loading/loading', () => {
  return function Loading() {
    return <div data-testid="loading">Loading...</div>;
  };
});

jest.mock('@/app/components/ui/Pagination/Pagination', () => {
  return function Pagination({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
  }) {
    return (
      <div data-testid="pagination">
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          Next
        </button>
      </div>
    );
  };
});

jest.mock('./DeleteReferenceDialog', () => ({
  DeleteReferenceDialog: ({
    open,
    reference,
    onConfirm,
    onOpenChange,
  }: {
    open: boolean;
    reference: string;
    onConfirm: () => void;
    onOpenChange: (v: boolean) => void;
  }) =>
    open ? (
      <div data-testid="delete-dialog">
        <span data-testid="delete-ref">{reference}</span>
        <button data-testid="confirm-delete" onClick={onConfirm}>
          Confirm
        </button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}));

// @mui/icons-material renders the real SVG with data-testid="DeleteForeverIcon"

jest.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Autocomplete: simple searchable select stub
jest.mock('@developmentsnil/awake-ui/autocomplete', () => {
  const { useState } = jest.requireActual<typeof import('react')>('react');
  function Root({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    items?: string[];
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    return (
      <div>
        <input
          data-testid="currency-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onValueChange?.(e.target.value);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && <div data-testid="currency-popup">{children}</div>}
      </div>
    );
  }
  const stub = (props: { children?: React.ReactNode }) => <>{props.children}</>;
  return {
    Autocomplete: {
      Root,
      InputGroup: stub,
      Input: ({ placeholder }: { placeholder?: string }) => (
        <input data-testid="currency-input-inner" placeholder={placeholder} />
      ),
      Trigger: stub,
      Clear: stub,
      Portal: stub,
      Positioner: stub,
      Popup: stub,
      List: stub,
      Item: ({ value, children }: { value: string; children: React.ReactNode }) => (
        <div data-testid={`ac-item-${value}`}>{children}</div>
      ),
      Empty: stub,
      useFilteredItems: (items: string[]) => items,
    },
  };
});


jest.mock('@/app/hooks/useExportMenuPdf/useExportMenuPdf', () => ({
  useExportMenuPdf: () => ({ exportPdf: jest.fn().mockResolvedValue(undefined), isExporting: false }),
}));

jest.mock('@/app/components/ExportPdfModal/ExportPdfModal', () => ({
  ExportPdfModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="export-pdf-modal"><button onClick={onClose}>close-modal</button></div> : null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeGroup = (reference: string) => ({
  reference,
  currencies: [
    { currency: 'BRL', incoming_value: 5000, expense_value: 1500, net_income: 3500 },
  ],
});

const defaultHooks = () => {
  (useIncomings as jest.Mock).mockReturnValue({ deleteByReferenceMutation: jest.fn() });
  (useExpenses as jest.Mock).mockReturnValue({ deleteByReferenceMutation: jest.fn() });
  (useExchangeRates as jest.Mock).mockReturnValue({ data: null });
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('List Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultHooks();
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  describe('Loading state', () => {
    it('renders the loading indicator while data is fetching', () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });
      render(<List />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  // ── Empty ──────────────────────────────────────────────────────────────────
  describe('Empty state', () => {
    it('shows the empty message when there are no records', () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [], totalElements: 0 },
        isLoading: false,
      });
      render(<List />);
      expect(screen.getByText('list.empty')).toBeInTheDocument();
    });
  });

  // ── Rendering ──────────────────────────────────────────────────────────────
  describe('Data rendering', () => {
    it('renders a card for each reference group', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: {
          data: [makeGroup('01/2024'), makeGroup('02/2024')],
          totalElements: 2,
        },
        isLoading: false,
      });
      render(<List />);
      await waitFor(() => {
        expect(screen.getByText('01/2024')).toBeInTheDocument();
        expect(screen.getByText('02/2024')).toBeInTheDocument();
      });
    });

    it('shows the currency code for each currency row', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await waitFor(() => {
        expect(screen.getByText(/BRL/)).toBeInTheDocument();
      });
    });

    it('renders the pagination component', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  describe('Navigation', () => {
    it('renders a link to the details page for each reference', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await waitFor(() => {
        const link = screen.getByText('01/2024').closest('a');
        expect(link).toHaveAttribute('href', '/details/01%2F2024');
      });
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  describe('Delete reference', () => {
    it('opens the delete dialog when the delete icon is clicked', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await userEvent.click(screen.getByTestId('DeleteForeverIcon'));
      await waitFor(() => {
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('delete-ref')).toHaveTextContent('01/2024');
      });
    });

    it('calls both delete mutations on confirm', async () => {
      const deleteIncomings = jest.fn().mockResolvedValue(undefined);
      const deleteExpenses = jest.fn().mockResolvedValue(undefined);
      (useIncomings as jest.Mock).mockReturnValue({ deleteByReferenceMutation: deleteIncomings });
      (useExpenses as jest.Mock).mockReturnValue({ deleteByReferenceMutation: deleteExpenses });
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });

      render(<List />);
      await userEvent.click(screen.getByTestId('DeleteForeverIcon'));
      await userEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(deleteIncomings).toHaveBeenCalledWith('01/2024');
        expect(deleteExpenses).toHaveBeenCalledWith('01/2024');
      });
    });
  });

  // ── Currency autocomplete ──────────────────────────────────────────────────
  describe('Currency autocomplete', () => {
    it('renders the currency input', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await waitFor(() => {
        expect(screen.getByTestId('currency-input')).toBeInTheDocument();
      });
    });
  });

  // ── Export PDF ────────────────────────────────────────────────────────────
  describe('Export PDF', () => {
    it('opens the export modal when the export button is clicked', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await userEvent.click(screen.getByTestId('export-pdf-button'));
      await waitFor(() => {
        expect(screen.getByTestId('export-pdf-modal')).toBeInTheDocument();
      });
    });

    it('closes the export modal when onClose is called', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await userEvent.click(screen.getByTestId('export-pdf-button'));
      await userEvent.click(screen.getByText('close-modal'));
      await waitFor(() => {
        expect(screen.queryByTestId('export-pdf-modal')).not.toBeInTheDocument();
      });
    });
  });

});
