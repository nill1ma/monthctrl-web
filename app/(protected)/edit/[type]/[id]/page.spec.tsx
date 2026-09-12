import { render, screen } from '@testing-library/react'
import EditPage from './page'
import { useExpenses } from '@/app/hooks/useExpenses/useExpenses'
import { useIncomings } from '@/app/hooks/useIncomings/useIncomings'
import { useParams } from 'next/navigation'

// Mock the hooks
jest.mock('@/app/hooks/useExpenses/useExpenses')
jest.mock('@/app/hooks/useIncomings/useIncomings')
jest.mock('next/navigation')

// Mock the Loading component
jest.mock('@/app/components/loading/loading', () => {
  return function Loading() {
    return <div data-testid="loading">Loading...</div>
  };
})

// Mock the TransactionFormPage component
jest.mock('@/app/components/TransactionFormPage/TransactionFormPage', () => {
  return function TransactionFormPage({ mode, type, id, initialData, redirectTo }: {
    mode: string;
    type: string;
    id: string;
    initialData: unknown;
    redirectTo: string;
  }) {
    return (
      <div data-testid="transaction-form-page" data-mode={mode} data-type={type} data-id={id}>
        <div>Mode: {mode}</div>
        <div>Type: {type}</div>
        <div>ID: {id}</div>
        <div>Initial Data: {JSON.stringify(initialData)}</div>
        <div>Redirect To: {redirectTo}</div>
      </div>
    )
  }
})

describe('EditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state when data is loading', () => {
    ;(useParams as jest.Mock).mockReturnValue({ type: 'expenses', id: '1' })
    ;(useIncomings as jest.Mock).mockReturnValue({
      dataSingleIncoming: null,
      isLoadingSingleIncoming: false,
    })
    ;(useExpenses as jest.Mock).mockReturnValue({
      dataSingleExpense: null,
      isLoadingSingleExpense: true,
    })

    render(<EditPage />)

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('renders TransactionFormPage with expense data', () => {
    const mockExpense = {
      id: '1',
      destination: 'Rent',
      value: 1500,
      reference: '01/2024',
    }

    ;(useParams as jest.Mock).mockReturnValue({ type: 'expenses', id: '1' })
    ;(useIncomings as jest.Mock).mockReturnValue({
      dataSingleIncoming: null,
      isLoadingSingleIncoming: false,
    })
    ;(useExpenses as jest.Mock).mockReturnValue({
      dataSingleExpense: mockExpense,
      isLoadingSingleExpense: false,
    })

    render(<EditPage />)

    const formPage = screen.getByTestId('transaction-form-page')
    expect(formPage).toBeInTheDocument()
    expect(formPage).toHaveAttribute('data-mode', 'edit')
    expect(formPage).toHaveAttribute('data-type', 'expenses')
    expect(formPage).toHaveAttribute('data-id', '1')
    expect(screen.getByText(`Initial Data: ${JSON.stringify(mockExpense)}`)).toBeInTheDocument()
  })

  it('renders TransactionFormPage with incoming data', () => {
    const mockIncoming = {
      id: '2',
      origin: 'Salary',
      value: 5000,
      reference: '02/2024',
    }

    ;(useParams as jest.Mock).mockReturnValue({ type: 'incomings', id: '2' })
    ;(useIncomings as jest.Mock).mockReturnValue({
      dataSingleIncoming: mockIncoming,
      isLoadingSingleIncoming: false,
    })
    ;(useExpenses as jest.Mock).mockReturnValue({
      dataSingleExpense: null,
      isLoadingSingleExpense: false,
    })

    render(<EditPage />)

    const formPage = screen.getByTestId('transaction-form-page')
    expect(formPage).toBeInTheDocument()
    expect(formPage).toHaveAttribute('data-mode', 'edit')
    expect(formPage).toHaveAttribute('data-type', 'incomings')
    expect(formPage).toHaveAttribute('data-id', '2')
    expect(screen.getByText(`Initial Data: ${JSON.stringify(mockIncoming)}`)).toBeInTheDocument()
  })

  it('redirects to list when initial data has no reference', () => {
    const mockExpense = {
      id: '1',
      destination: 'Rent',
      value: 1500,
      reference: null,
    }

    ;(useParams as jest.Mock).mockReturnValue({ type: 'expenses', id: '1' })
    ;(useIncomings as jest.Mock).mockReturnValue({
      dataSingleIncoming: null,
      isLoadingSingleIncoming: false,
    })
    ;(useExpenses as jest.Mock).mockReturnValue({
      dataSingleExpense: mockExpense,
      isLoadingSingleExpense: false,
    })

    render(<EditPage />)

    expect(screen.getByText('Redirect To: /list')).toBeInTheDocument()
  })
})