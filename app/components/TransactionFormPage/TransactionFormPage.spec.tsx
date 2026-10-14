import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionFormPage from './TransactionFormPage';

// ── Navigation / intl ──────────────────────────────────────────────────────────
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  FormattedMessage: ({ id }: { id: string }) => <>{id}</>,
}));

// ── MUI ───────────────────────────────────────────────────────────────────────
jest.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@mui/icons-material', () => ({
  ArrowCircleLeft: () => <span data-testid="back-icon" />,
}));

// ── awake-ui ──────────────────────────────────────────────────────────────────
jest.mock('@developmentsnil/awake-ui/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

// ── Forms ─────────────────────────────────────────────────────────────────────
jest.mock('@/app/components/forms', () => ({
  IncomingForm: ({
    id,
    defaultValues,
    onSuccess,
  }: {
    id?: string;
    defaultValues?: unknown;
    onSuccess: () => void;
  }) => (
    <div data-testid="incoming-form" data-id={id}>
      <span data-testid="incoming-defaults">{JSON.stringify(defaultValues)}</span>
      <button data-testid="incoming-submit" onClick={onSuccess}>
        Submit Incoming
      </button>
    </div>
  ),
  ExpenseForm: ({
    id,
    defaultValues,
    onSuccess,
  }: {
    id?: string;
    defaultValues?: unknown;
    onSuccess: () => void;
  }) => (
    <div data-testid="expense-form" data-id={id}>
      <span data-testid="expense-defaults">{JSON.stringify(defaultValues)}</span>
      <button data-testid="expense-submit" onClick={onSuccess}>
        Submit Expense
      </button>
    </div>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Create mode ─────────────────────────────────────────────────────────────
  describe('create mode', () => {
    it('renders the back button', () => {
      render(<TransactionFormPage mode="create" />);
      expect(screen.getByText('create.update.goToPrevious.button')).toBeInTheDocument();
    });

    it('calls router.back() when the back button is clicked', async () => {
      render(<TransactionFormPage mode="create" />);
      await userEvent.click(screen.getByText('create.update.goToPrevious.button'));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('renders both tabs in create mode', () => {
      render(<TransactionFormPage mode="create" />);
      expect(screen.getByText('create.update.tab.incomings')).toBeInTheDocument();
      expect(screen.getByText('create.update.tab.expenses')).toBeInTheDocument();
    });

    it('shows IncomingForm by default (incomings tab active)', () => {
      render(<TransactionFormPage mode="create" />);
      expect(screen.getByTestId('incoming-form')).toBeInTheDocument();
      expect(screen.queryByTestId('expense-form')).not.toBeInTheDocument();
    });

    it('shows the "Create Incoming" title by default', () => {
      render(<TransactionFormPage mode="create" />);
      expect(screen.getByText('create.title.incomings')).toBeInTheDocument();
    });

    it('switches to ExpenseForm when the expenses tab is clicked', async () => {
      render(<TransactionFormPage mode="create" />);
      await userEvent.click(screen.getByText('create.update.tab.expenses'));
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();
      expect(screen.queryByTestId('incoming-form')).not.toBeInTheDocument();
    });

    it('updates the title when switching to the expenses tab', async () => {
      render(<TransactionFormPage mode="create" />);
      await userEvent.click(screen.getByText('create.update.tab.expenses'));
      expect(screen.getByText('create.title.expenses')).toBeInTheDocument();
    });

    it('can switch back to the incomings tab', async () => {
      render(<TransactionFormPage mode="create" />);
      await userEvent.click(screen.getByText('create.update.tab.expenses'));
      await userEvent.click(screen.getByText('create.update.tab.incomings'));
      expect(screen.getByTestId('incoming-form')).toBeInTheDocument();
    });

    it('redirects to /list after a successful form submission', async () => {
      render(<TransactionFormPage mode="create" />);
      await userEvent.click(screen.getByTestId('incoming-submit'));
      expect(mockPush).toHaveBeenCalledWith('/list');
    });

    it('uses a custom redirectTo prop after success', async () => {
      render(<TransactionFormPage mode="create" redirectTo="/details/01%2F2024" />);
      await userEvent.click(screen.getByTestId('incoming-submit'));
      expect(mockPush).toHaveBeenCalledWith('/details/01%2F2024');
    });
  });

  // ── Edit mode ────────────────────────────────────────────────────────────────
  describe('edit mode', () => {
    it('does NOT render tabs in edit mode', () => {
      render(<TransactionFormPage mode="edit" type="expenses" id="1" />);
      expect(screen.queryByText('create.update.tab.incomings')).not.toBeInTheDocument();
      expect(screen.queryByText('create.update.tab.expenses')).not.toBeInTheDocument();
    });

    it('renders ExpenseForm when type is "expenses"', () => {
      render(<TransactionFormPage mode="edit" type="expenses" id="42" />);
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();
      expect(screen.getByTestId('expense-form')).toHaveAttribute('data-id', '42');
    });

    it('renders IncomingForm when type is "incomings"', () => {
      render(<TransactionFormPage mode="edit" type="incomings" id="7" />);
      expect(screen.getByTestId('incoming-form')).toBeInTheDocument();
      expect(screen.getByTestId('incoming-form')).toHaveAttribute('data-id', '7');
    });

    it('shows the "Edit Incoming" title for incomings', () => {
      render(<TransactionFormPage mode="edit" type="incomings" id="1" />);
      expect(screen.getByText('update.title.incomings')).toBeInTheDocument();
    });

    it('shows the "Edit Expense" title for expenses', () => {
      render(<TransactionFormPage mode="edit" type="expenses" id="1" />);
      expect(screen.getByText('update.title.expenses')).toBeInTheDocument();
    });

    it('passes initialData down to the form', () => {
      const data = { id: '1', destination: 'Rent', value: 1500, reference: '01/2024' };
      render(<TransactionFormPage mode="edit" type="expenses" id="1" initialData={data} />);
      expect(screen.getByTestId('expense-defaults')).toHaveTextContent(JSON.stringify(data));
    });

    it('redirects to /list after successful edit when no redirectTo given', async () => {
      render(<TransactionFormPage mode="edit" type="expenses" id="1" />);
      await userEvent.click(screen.getByTestId('expense-submit'));
      expect(mockPush).toHaveBeenCalledWith('/list');
    });

    it('redirects to the given redirectTo path after successful edit', async () => {
      render(
        <TransactionFormPage
          mode="edit"
          type="incomings"
          id="2"
          redirectTo="/details/02%2F2024"
        />,
      );
      await userEvent.click(screen.getByTestId('incoming-submit'));
      expect(mockPush).toHaveBeenCalledWith('/details/02%2F2024');
    });
  });
});
