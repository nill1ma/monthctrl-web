import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionFormPage from './TransactionFormPage';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('@awakr/awake-ui/button', () => ({
  Button: ({ children, onClick, title }: any) =>
    <button onClick={onClick} title={title}>{children}</button>,
}));

jest.mock('@/app/components/icons', () => ({
  ArrowCircleLeftIcon: ({ className }: any) => <span data-testid="back-icon" className={className} />,
}));

jest.mock('@/app/components/forms', () => ({
  IncomingForm: ({ id, defaultValues, onSuccess }: any) => (
    <div data-testid="incoming-form" data-id={id}>
      <span data-testid="incoming-defaults">{JSON.stringify(defaultValues)}</span>
      <button data-testid="incoming-submit" onClick={onSuccess}>Submit Incoming</button>
    </div>
  ),
  ExpenseForm: ({ id, defaultValues, onSuccess }: any) => (
    <div data-testid="expense-form" data-id={id}>
      <span data-testid="expense-defaults">{JSON.stringify(defaultValues)}</span>
      <button data-testid="expense-submit" onClick={onSuccess}>Submit Expense</button>
    </div>
  ),
}));

describe('TransactionFormPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('renders incoming form by default in create mode', () => {
    render(<TransactionFormPage mode="create" />);
    expect(screen.getByTestId('incoming-form')).toBeInTheDocument();
  });

  it('renders expense form when type is expenses in edit mode', () => {
    render(<TransactionFormPage mode="edit" type="expenses" />);
    expect(screen.getByTestId('expense-form')).toBeInTheDocument();
  });

  it('renders back button icon', () => {
    render(<TransactionFormPage mode="create" />);
    expect(screen.getByTestId('back-icon')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionFormPage mode="create" />);
    await user.click(screen.getByTestId('back-icon').closest('button')!);
    expect(mockBack).toHaveBeenCalled();
  });

  it('passes id to form when provided in edit mode', () => {
    render(<TransactionFormPage mode="edit" type="incomings" id="123" />);
    expect(screen.getByTestId('incoming-form')).toHaveAttribute('data-id', '123');
  });

  it('redirects to list after successful submission', async () => {
    const user = userEvent.setup();
    render(<TransactionFormPage mode="create" />);
    await user.click(screen.getByTestId('incoming-submit'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/list'));
  });

  it('redirects to custom path when redirectTo is provided', async () => {
    const user = userEvent.setup();
    render(<TransactionFormPage mode="create" redirectTo="/details/2024-01" />);
    await user.click(screen.getByTestId('incoming-submit'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/details/2024-01'));
  });
});
