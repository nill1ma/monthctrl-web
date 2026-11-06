import { render, screen } from '@testing-library/react'
import CurrencyChart from './CurrencyChart'

jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="currency-bar-chart">{children}</div>,
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`} />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

const incomings = [
  { origin: 'Salário', value: 5000, currency: 'BRL' },
  { origin: 'Freelance', value: 1000, currency: 'BRL' },
]

const expenses = [
  { destination: 'Aluguel', value: 1500, currency: 'BRL' },
]

describe('CurrencyChart', () => {
  it('renders bar chart when data exists', () => {
    render(<CurrencyChart currency="BRL" incomings={incomings} expenses={expenses} />)
    expect(screen.getByTestId('currency-bar-chart')).toBeInTheDocument()
  })

  it('renders incoming and expense bars', () => {
    render(<CurrencyChart currency="BRL" incomings={incomings} expenses={expenses} />)
    expect(screen.getByTestId('bar-incoming')).toBeInTheDocument()
    expect(screen.getByTestId('bar-expense')).toBeInTheDocument()
  })

  it('renders nothing when both incomings and expenses are empty', () => {
    const { container } = render(<CurrencyChart currency="USD" incomings={[]} expenses={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
