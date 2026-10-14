import { render, screen } from '@testing-library/react';
import CreateForm from './page';

// TransactionFormPage handles all the real logic — tested in its own spec.
// This spec only verifies that the Create route wires up mode="create" correctly.
jest.mock('@/app/components/TransactionFormPage/TransactionFormPage', () => {
  return function TransactionFormPage({
    mode,
    type,
    id,
    redirectTo,
  }: {
    mode: string;
    type?: string;
    id?: string;
    redirectTo?: string;
  }) {
    return (
      <div
        data-testid="transaction-form-page"
        data-mode={mode}
        data-type={type ?? ''}
        data-id={id ?? ''}
        data-redirect-to={redirectTo ?? ''}
      >
        Transaction Form Page
      </div>
    );
  };
});

describe('Create page', () => {
  it('renders TransactionFormPage in create mode', () => {
    render(<CreateForm />);
    const form = screen.getByTestId('transaction-form-page');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-mode', 'create');
  });

  it('does not pass a type or id (create has no pre-selected type)', () => {
    render(<CreateForm />);
    const form = screen.getByTestId('transaction-form-page');
    expect(form).toHaveAttribute('data-type', '');
    expect(form).toHaveAttribute('data-id', '');
  });
});
