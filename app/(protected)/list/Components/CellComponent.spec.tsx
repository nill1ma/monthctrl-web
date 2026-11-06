import { render, screen } from '@testing-library/react'
import CellContent from './CellComponent'

jest.mock('@/app/components/ui/table/Table', () => ({
  TableCell: ({ children, className }: any) => <td className={className}>{children}</td>,
}))

jest.mock('@/app/components/referenceDate/ReferenceDate', () =>
  ({ reference, format }: { reference: string; format?: string }) =>
    <span data-testid="ref-date">{reference}-{format}</span>
)

const column = { key: 'reference', label: 'Referência' }
const item = { reference: '2024-01', name: 'Test' }

describe('CellContent', () => {
  it('renders ReferenceDate for reference column', () => {
    render(<CellContent column={column} item={item} />, { wrapper: ({ children }) => <table><tbody><tr>{children}</tr></tbody></table> })
    expect(screen.getByTestId('ref-date')).toBeInTheDocument()
  })

  it('renders raw value for non-reference columns', () => {
    render(
      <CellContent column={{ key: 'name', label: 'Nome' }} item={item} />,
      { wrapper: ({ children }) => <table><tbody><tr>{children}</tr></tbody></table> }
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('applies className to cell', () => {
    const { container } = render(
      <CellContent column={column} item={item} className="custom" />,
      { wrapper: ({ children }) => <table><tbody><tr>{children}</tr></tbody></table> }
    )
    expect(container.querySelector('td')).toHaveClass('custom')
  })
})
