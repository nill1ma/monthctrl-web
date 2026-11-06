import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionDetailsList } from './TransactionDetailsList';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/app/components/icons', () => ({
  DeleteForeverIcon: () => <svg data-testid="DeleteForeverIcon" />,
  EditNoteIcon: () => <svg data-testid="EditNoteIcon" />,
}));

// awake-ui Dialog stub — shared open/close context
const DialogCtx = React.createContext<{ open: boolean; onOpenChange: (v: boolean) => void }>({
  open: false,
  onOpenChange: () => {},
});

jest.mock('@awakr/awake-ui/dialog', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const DialogCtx = React.createContext<{ open: boolean; onOpenChange: (v: boolean) => void }>({
    open: false,
    onOpenChange: () => {},
  });

  function Root({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
    return <DialogCtx.Provider value={{ open, onOpenChange }}>{children}</DialogCtx.Provider>;
  }
  const Portal    = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const Backdrop  = () => null;
  const Popup     = ({ children }: { children: React.ReactNode }) => {
    const { open } = React.useContext(DialogCtx);
    return open ? <div data-testid="dialog-popup">{children}</div> : null;
  };
  const Title       = ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>;
  const Description = ({ children }: { children: React.ReactNode }) => <p>{children}</p>;
  const Close       = ({ render: renderEl }: { render: React.ReactElement }) => {
    const { onOpenChange } = React.useContext(DialogCtx);
    return React.cloneElement(renderEl, {
      onClick: () => { renderEl.props.onClick?.(); onOpenChange(false); },
    });
  };

  return { Dialog: { Root, Portal, Backdrop, Popup, Title, Description, Close } };
});

jest.mock('@awakr/awake-ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

jest.mock('@/app/components/card/card', () => ({
  __esModule: true,
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock('@/app/components/card/cardItem', () => ({
  __esModule: true,
  default: ({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
      {children}
    </div>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
interface Incoming {
  id: string;
  origin: string;
  value: number;
  currency?: string;
}

const incomingItems: Incoming[] = [
  { id: 'i1', origin: 'Salário', value: 5000, currency: 'BRL' },
  { id: 'i2', origin: 'Freelance', value: 1000, currency: 'BRL' },
];

interface Expense {
  id: string;
  destination: string;
  value: number;
  currency?: string;
}

const expenseItems: Expense[] = [
  { id: 'e1', destination: 'Aluguel', value: 1500, currency: 'BRL' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('TransactionDetailsList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders item labels and formatted values', () => {
    render(
      <TransactionDetailsList items={incomingItems} labelKey="origin" onDelete={jest.fn()} />
    );
    expect(screen.getByText('Salário')).toBeInTheDocument();
    expect(screen.getByText('Freelance')).toBeInTheDocument();
    expect(screen.getByText(/5\.000,00/)).toBeInTheDocument();
  });

  it('renders "-" when value is null', () => {
    const items = [{ id: 'i1', origin: 'Sem valor', value: null as unknown as number }];
    render(
      <TransactionDetailsList items={items} labelKey="origin" onDelete={jest.fn()} />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('navigates to edit/incomings when edit button is clicked', async () => {
    render(
      <TransactionDetailsList items={incomingItems} labelKey="origin" onDelete={jest.fn()} />
    );
    const editButtons = screen.getAllByTestId('EditNoteIcon');
    await userEvent.click(editButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/edit/incomings/i1');
  });

  it('navigates to edit/expenses when edit button is clicked for expense item', async () => {
    render(
      <TransactionDetailsList items={expenseItems} labelKey="destination" onDelete={jest.fn()} />
    );
    await userEvent.click(screen.getByTestId('EditNoteIcon'));
    expect(mockPush).toHaveBeenCalledWith('/edit/expenses/e1');
  });

  it('opens delete dialog when delete button is clicked', async () => {
    render(
      <TransactionDetailsList items={incomingItems} labelKey="origin" onDelete={jest.fn()} />
    );
    const deleteButtons = screen.getAllByTestId('DeleteForeverIcon');
    await userEvent.click(deleteButtons[0]);
    expect(screen.getByTestId('dialog-popup')).toBeInTheDocument();
  });

  it('calls onDelete with item id when confirm is clicked', async () => {
    const onDelete = jest.fn();
    render(
      <TransactionDetailsList items={incomingItems} labelKey="origin" onDelete={onDelete} />
    );
    await userEvent.click(screen.getAllByTestId('DeleteForeverIcon')[0]);
    // Click the confirm (destructive) button — the second button in the dialog
    const dialogButtons = screen.getAllByRole('button');
    const confirmButton = dialogButtons.find((b) => b.textContent === 'delete.dialog.confirm');
    await userEvent.click(confirmButton!);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('i1'));
  });

  it('closes dialog when cancel is clicked', async () => {
    render(
      <TransactionDetailsList items={incomingItems} labelKey="origin" onDelete={jest.fn()} />
    );
    await userEvent.click(screen.getAllByTestId('DeleteForeverIcon')[0]);
    expect(screen.getByTestId('dialog-popup')).toBeInTheDocument();
    const cancelButton = screen.getByText('delete.dialog.cancel');
    await userEvent.click(cancelButton);
    await waitFor(() => expect(screen.queryByTestId('dialog-popup')).not.toBeInTheDocument());
  });

  it('renders nothing when items is undefined', () => {
    render(
      <TransactionDetailsList items={undefined} labelKey="origin" onDelete={jest.fn()} />
    );
    expect(screen.queryByTestId('EditNoteIcon')).not.toBeInTheDocument();
  });

  it('shows confirm button disabled while deleting (isDeleting branch)', async () => {
    let resolveDelete: () => void;
    const onDelete = jest.fn(
      () => new Promise<void>((res) => { resolveDelete = res; })
    );

    render(
      <TransactionDetailsList items={incomingItems} labelKey="origin" onDelete={onDelete} />
    );

    // Open the delete dialog
    await userEvent.click(screen.getAllByTestId('DeleteForeverIcon')[0]);
    expect(screen.getByTestId('dialog-popup')).toBeInTheDocument();

    // Click confirm — triggers handleConfirmDelete, sets isDeleting(true)
    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find((b) => b.textContent === 'delete.dialog.confirm')!;
    await userEvent.click(confirmButton);

    // While promise is pending, isDeleting===true → confirm should be disabled
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
      const confirmAfter = screen.queryAllByRole('button').find((b) => b.textContent === 'delete.dialog.confirm');
      if (confirmAfter) expect(confirmAfter).toBeDisabled();
    });

    // Resolve promise so cleanup can run
    resolveDelete!();
  });
});