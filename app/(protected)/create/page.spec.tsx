import { render, screen } from '@testing-library/react'
import CreateForm from './page'

// Mock the TransactionFormPage component
jest.mock('@/app/components/TransactionFormPage/TransactionFormPage', () => {
  return function TransactionFormPage({ mode }: { mode: string }) {
    return <div data-testid="transaction-form-page" data-mode={mode}>Transaction Form Page</div>
  }
})

describe('Create Form', () => {
  it('should render TransactionFormPage with create mode', () => {
    render(<CreateForm />)

    const formPage = screen.getByTestId('transaction-form-page')
    expect(formPage).toBeInTheDocument()
    expect(formPage).toHaveAttribute('data-mode', 'create')
  })
})