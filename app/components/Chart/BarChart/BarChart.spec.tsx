import { render } from '@testing-library/react'
import BarChartComponent from './BarChart'

jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
}))

describe('BarChartComponent', () => {
  const props = {
    id: 'test',
    dataAxis: ['Jan', 'Feb', 'Mar'],
    data: [100, 200, 150],
  }

  it('renders without crashing', () => {
    const { getByTestId } = render(<BarChartComponent {...props} />)
    expect(getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('applies className to wrapper', () => {
    const { container } = render(<BarChartComponent {...props} className="my-chart" />)
    expect(container.firstChild).toHaveClass('my-chart')
  })
})
