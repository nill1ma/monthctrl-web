import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from './page';
import { useIncomingsExpensesTransactionsList } from '@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList';
import { useIncomings } from '@/app/hooks/useIncomings/useIncomings';
import { useExpenses } from '@/app/hooks/useExpenses/useExpenses';
import { useExchangeRates } from '@/app/hooks/useExchangeRates/useExchangeRates';

// ── Hooks ───────────────────────────────────────────────────────────────────
jest.mock('@/app/components/icons', () => ({
  ArrowCircleLeftIcon: () => <svg data-testid="ArrowCircleLeftIcon" />,
  FileDownloadIcon: () => <svg data-testid="FileDownloadIcon" />,
  Spinner: ({ size }: { size?: number }) => <svg data-testid="Spinner" />,
  DeleteForeverIcon: () => <svg data-testid="DeleteForeverIcon" />,
}));

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


// Autocomplete: simple searchable select stub
jest.mock('@awakr/awake-ui/autocomplete', () => {
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
      useFilteredItems: () => ['BRL', 'USD', 'EUR'],
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

  // ── CurrencyList (lines 32-36) ───────────────────────────────────────────
  describe('CurrencyList popup', () => {
    it('renders currency items when the autocomplete popup is open', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      fireEvent.focus(screen.getByTestId('currency-input'));
      await waitFor(() => {
        expect(screen.getByTestId('currency-popup')).toBeInTheDocument();
        expect(screen.getByTestId('ac-item-BRL')).toBeInTheDocument();
        expect(screen.getByTestId('ac-item-USD')).toBeInTheDocument();
      });
    });
  });

  // ── handleCurrencyChange debounce (lines 56-58) ──────────────────────────
  describe('Currency change debounce', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    it('calls useExchangeRates with the selected currency after the debounce delay', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      (useExchangeRates as jest.Mock).mockReturnValue({ data: null });

      render(<List />);
      fireEvent.change(screen.getByTestId('currency-input'), { target: { value: 'USD' } });
      expect(useExchangeRates).toHaveBeenLastCalledWith('', []);
      act(() => { jest.advanceTimersByTime(400); });
      await waitFor(() => {
        expect(useExchangeRates).toHaveBeenCalledWith('USD', expect.any(Array));
      });
    });
  });

  // ── Currency conversion display (lines 205-225) ───────────────────────────
  describe('Currency conversion display', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    const usdGroup = {
      reference: '01/2024',
      currencies: [
        { currency: 'USD', incoming_value: 1000, expense_value: 200, net_income: 800 },
      ],
    };

    it('renders converted totals when displayCurrency is set and rates are available', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [usdGroup], totalElements: 1 },
        isLoading: false,
      });
      (useExchangeRates as jest.Mock).mockReturnValue({ data: { USD: 0.2 } });

      render(<List />);
      fireEvent.change(screen.getByTestId('currency-input'), { target: { value: 'BRL' } });
      act(() => { jest.advanceTimersByTime(400); });

      await waitFor(() => {
        expect(screen.getByText(/BRL\s*≈/)).toBeInTheDocument();
      });
    });

    it('shows unavailable message when conversion rate is missing', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [usdGroup], totalElements: 1 },
        isLoading: false,
      });
      (useExchangeRates as jest.Mock).mockReturnValue({ data: {} });

      render(<List />);
      fireEvent.change(screen.getByTestId('currency-input'), { target: { value: 'BRL' } });
      act(() => { jest.advanceTimersByTime(400); });

      await waitFor(() => {
        expect(screen.getByText('list.currency.unavailable')).toBeInTheDocument();
      });
    });
  });

  // ── Pagination onPageChange (line 272) ────────────────────────────────────
  describe('Pagination', () => {
    it('advances to the next page when the Next button is clicked', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 20 },
        isLoading: false,
      });
      render(<List />);
      await userEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(useIncomingsExpensesTransactionsList).toHaveBeenCalledWith(2);
      });
    });
  });

  // ── DeleteReferenceDialog onOpenChange close (line 275) ───────────────────
  describe('Delete dialog close', () => {
    it('closes the delete dialog when Cancel is clicked', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: { data: [makeGroup('01/2024')], totalElements: 1 },
        isLoading: false,
      });
      render(<List />);
      await userEvent.click(screen.getByTestId('DeleteForeverIcon'));
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      await userEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
      });
    });
  });

});
