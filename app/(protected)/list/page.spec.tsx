import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from './page';
import { useIncomingsExpensesTransactionsList } from '@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList';

// Mock the hook
jest.mock('@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList');

// Mock the Loading component
jest.mock('@/app/components/loading/loading', () => {
  return function Loading() {
    return <div data-testid="loading">Loading...</div>;
  };
});

// Mock the Table components
jest.mock('@/app/components/ui/table/Table', () => ({
  Table: ({ children, className }: { children: React.ReactNode; className?: string }) => <table data-testid="table" className={className}>{children}</table>,
  TableHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <thead className={className}>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => <tr className={className} onClick={onClick}>{children}</tr>,
  TableCell: ({ children, className }: { children: React.ReactNode; className?: string }) => <td className={className}>{children}</td>,
}));

// Mock the CellContent component
jest.mock('./Components/CellComponent', () => {
  return function CellContent({ column, item, className }: { column: { key: string }; item: Record<string, unknown>; className?: string }) {
    return <td className={className}>{String(item[column.key])}</td>;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('List Component', () => {
  const mockData = [
    { id: 1, reference: '01/2024', incoming_value: 5000, expense_value: 1500, net_income: 3500 },
    { id: 2, reference: '02/2024', incoming_value: 2000, expense_value: 800, net_income: 1200 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Fetching', () => {
    it('should show loading state initially', () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<List />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should render data when loaded', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      render(<List />);

      await waitFor(() => {
        expect(screen.getByTestId('table')).toBeInTheDocument();
      });
    });

    it('should show no data message when data is empty', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<List />);

      await waitFor(() => {
        expect(screen.getByText('No data')).toBeInTheDocument();
      });
    });
  });

  describe('Table Rendering', () => {
    it('should render table headers correctly', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      render(<List />);

      await waitFor(() => {
        expect(screen.getByText('Reference')).toBeInTheDocument();
        expect(screen.getByText('Incomings')).toBeInTheDocument();
        expect(screen.getByText('Expenses')).toBeInTheDocument();
        expect(screen.getByText('Net Income')).toBeInTheDocument();
      });
    });

    it('should render data rows correctly', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      render(<List />);

      await waitFor(() => {
        expect(screen.getByText('01/2024')).toBeInTheDocument();
        expect(screen.getByText('02/2024')).toBeInTheDocument();
      });
    });

    it('should display correct values', async () => {
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      render(<List />);

      await waitFor(() => {
        expect(screen.getByText('5000')).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('3500')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should redirect to details page on row click', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { redirect } = require('next/navigation');
      (useIncomingsExpensesTransactionsList as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
      });

      render(<List />);

      await waitFor(() => {
        const row = screen.getByText('01/2024').closest('tr');
        if (row) {
          userEvent.click(row);
          expect(redirect).toHaveBeenCalledWith('/details/01%2F2024');
        }
      });
    });
  });
});