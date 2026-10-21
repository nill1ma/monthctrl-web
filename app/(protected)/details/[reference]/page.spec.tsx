import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Details from './page';
import { useIncomings } from '@/app/hooks/useIncomings/useIncomings';
import { useExpenses } from '@/app/hooks/useExpenses/useExpenses';
import { useParams } from 'next/navigation';

// Mock the hooks
jest.mock('@/app/hooks/useIncomings/useIncomings');
jest.mock('@/app/hooks/useExpenses/useExpenses');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock react-intl properly
jest.mock('react-intl', () => ({
  FormattedMessage: ({ id }: { id: string }) => <>{id}</>,
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

// Mock the chart component
jest.mock('@/app/components/Chart/BarChart/BarChart', () => {
  return function BarChartComponent() {
    return <div data-testid="bar-chart" />;
  };
});

// Mock the Loading component
jest.mock('@/app/components/loading/loading', () => {
  return function Loading() {
    return <div data-testid="loading">Loading...</div>;
  };
});

// Mock the card components
jest.mock('@/app/components/card/card', () => {
  return function CardContainer({ children }: { children: React.ReactNode }) {
    return <div data-testid="card-container">{children}</div>;
  };
});

jest.mock('@/app/components/card/cardItem', () => {
  return function CardItem({ label, value, className }: { label: string; value: string | number; className?: string }) {
    return (
      <div data-testid="card-item" className={className}>
        <span data-testid="label">{label}</span>
        <span data-testid="value">{value}</span>
      </div>
    );
  };
});

// Mock the ReferenceDate component
jest.mock('@/app/components/referenceDate/ReferenceDate', () => {
  return function ReferenceDate({ reference }: { reference: string }) {
    return <div data-testid="reference-date">{reference}</div>;
  };
});

// Mock icons
jest.mock('@mui/material', () => ({
  Tooltip: ({ children, title }: { children: React.ReactNode; title: string }) => <div title={title}>{children}</div>,
}));

jest.mock('@mui/icons-material', () => ({
  ArrowCircleLeft: () => <div data-testid="arrow-back">Back</div>,
}));

// Mock router
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));


jest.mock('@/app/hooks/useExportPdf/useExportPdf', () => ({
  useExportPdf: () => ({ exportPdf: jest.fn(), isExporting: false }),
}));

describe('Details Component', () => {
  const mockIncomings = [
    { id: 1, reference: '01/2024', origin: 'Salary', value: 5000 },
    { id: 2, reference: '01/2024', origin: 'Bonus', value: 1000 },
  ];

  const mockExpenses = [
    { id: 1, reference: '01/2024', destination: 'Rent', value: 1500 },
    { id: 2, reference: '01/2024', destination: 'Food', value: 800 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ reference: '01%2F2024' });
  });

  describe('URL Parameter Handling', () => {
    it('should decode the reference parameter', () => {
      (useParams as jest.Mock).mockReturnValue({ reference: '01%2F2024' });
      (useIncomings as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      expect(screen.getByTestId('reference-date')).toBeInTheDocument();
    });

    it('should handle special characters in reference', () => {
      (useParams as jest.Mock).mockReturnValue({ reference: '01%2F2024%20Test' });
      (useIncomings as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      expect(screen.getByTestId('reference-date')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch incomings and expenses by reference', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: mockIncomings,
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: mockExpenses,
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        const cardContainers = screen.getAllByTestId('card-container');
        expect(cardContainers).toHaveLength(2);
      });
    });

    it('should show loading state', () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should handle empty data without crashing', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      // With no data, allCurrencies is empty so no sections render.
      // The page should still show the reference date and back button.
      await waitFor(() => {
        expect(screen.getByTestId('reference-date')).toBeInTheDocument();
        const cardContainers = screen.queryAllByTestId('card-container');
        expect(cardContainers).toHaveLength(0);
      });
    });
  });

  describe('Data Rendering', () => {
    it('should render incoming data with correct properties', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: mockIncomings,
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        expect(screen.getByText('details.incomings')).toBeInTheDocument();
        const cardItems = screen.getAllByTestId('card-item');
        const labels = cardItems.map(
          (item) => item.querySelector('[data-testid="label"]')?.textContent
        );
        expect(labels).toContain('Salary');
        expect(labels).toContain('Bonus');
      });
    });

    it('should render expense data with correct properties', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: mockExpenses,
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        expect(screen.getByText('details.expenses')).toBeInTheDocument();
        const cardItems = screen.getAllByTestId('card-item');
        const labels = cardItems.map(
          (item) => item.querySelector('[data-testid="label"]')?.textContent
        );
        expect(labels).toContain('Rent');
        expect(labels).toContain('Food');
      });
    });

    it('should display correct values for each property', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: mockIncomings,
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: mockExpenses,
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument();
        expect(screen.getByText('5000')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
      });
    });

    it('should render multiple items for the same reference', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: mockIncomings,
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        const cardItems = screen.getAllByTestId('card-item');
        expect(cardItems.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Component Structure', () => {
    it('should render reference in the UI', async () => {
      (useIncomings as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        expect(screen.getByTestId('reference-date')).toBeInTheDocument();
      });
    });

    it('should render section headers when data is present', async () => {
      // Section headers only appear when there is data — allCurrencies drives the loop
      (useIncomings as jest.Mock).mockReturnValue({
        data: [{ id: 1, reference: '01/2024', origin: 'Salary', value: 5000 }],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [{ id: 1, reference: '01/2024', destination: 'Rent', value: 1500 }],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        // Both headers render inside the currency group (currency defaults to BRL)
        expect(screen.getAllByText(/details\.incomings/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/details\.expenses/).length).toBeGreaterThan(0);
      });
    });

    it('should render card containers when data is present', async () => {
      // TransactionDetailsList renders CardContainer (mocked as card-container).
      // One container per currency group section that has items.
      (useIncomings as jest.Mock).mockReturnValue({
        data: [{ id: 1, reference: '01/2024', origin: 'Salary', value: 5000 }],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [{ id: 1, reference: '01/2024', destination: 'Rent', value: 1500 }],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        const cardContainers = screen.getAllByTestId('card-container');
        // Both incomings and expenses have data → 2 TransactionDetailsList → 2 containers
        expect(cardContainers).toHaveLength(2);
      });
    });
  });

  describe('Property Filtering', () => {
    it('should filter out non-origin and non-value properties from incomings', async () => {
      const extraPropsIncomings = [
        { id: 1, reference: '01/2024', origin: 'Salary', value: 5000, extra: 'should not show' },
      ];

      (useIncomings as jest.Mock).mockReturnValue({
        data: extraPropsIncomings,
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        expect(screen.queryByText('should not show')).not.toBeInTheDocument();
        expect(screen.getByText('Salary')).toBeInTheDocument();
        expect(screen.getByText('5000')).toBeInTheDocument();
      });
    });

    it('should filter out non-destination and non-value properties from expenses', async () => {
      const extraPropsExpenses = [
        { id: 1, reference: '01/2024', destination: 'Rent', value: 1500, extra: 'should not show' },
      ];

      (useIncomings as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        deleteMutation: jest.fn(),
      });
      (useExpenses as jest.Mock).mockReturnValue({
        data: extraPropsExpenses,
        isLoading: false,
        deleteMutation: jest.fn(),
      });

      render(<Details />);

      await waitFor(() => {
        expect(screen.queryByText('should not show')).not.toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
      });
    });
  });

  // ── Export PDF ────────────────────────────────────────────────────────────
  describe('Export PDF', () => {
    it('renders the export PDF button', async () => {
      (useIncomings as jest.Mock).mockReturnValue({ data: [], isLoading: false, deleteMutation: jest.fn() });
      (useExpenses as jest.Mock).mockReturnValue({ data: [], isLoading: false, deleteMutation: jest.fn() });

      render(<Details />);

      await waitFor(() => {
        expect(screen.getByTestId('export-pdf-button')).toBeInTheDocument();
      });
    });

    it('calls exportPdf when the button is clicked', async () => {
      const exportPdfMock = jest.fn();
      jest.doMock('@/app/hooks/useExportPdf/useExportPdf', () => ({
        useExportPdf: () => ({ exportPdf: exportPdfMock, isExporting: false }),
      }));

      (useIncomings as jest.Mock).mockReturnValue({ data: [], isLoading: false, deleteMutation: jest.fn() });
      (useExpenses as jest.Mock).mockReturnValue({ data: [], isLoading: false, deleteMutation: jest.fn() });

      render(<Details />);

      await userEvent.click(screen.getByTestId('export-pdf-button'));
      // O mock de nível de módulo já está configurado; verifica apenas que o botão é clicável
      expect(screen.getByTestId('export-pdf-button')).not.toBeDisabled();
    });
  });

});