import { render, screen } from '@testing-library/react'
import CardItem from './cardItem'

describe('CardItem', () => {
  it('renders label and value', () => {
    render(<CardItem label="Valor" value="R$ 100" />)
    expect(screen.getByText('Valor:')).toBeInTheDocument()
    expect(screen.getByText('R$ 100')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    render(<CardItem label="Total" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<CardItem label="X" value="Y"><span data-testid="child">extra</span></CardItem>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies title attribute with label and value', () => {
    render(<CardItem label="Desc" value="Val" />)
    expect(screen.getByTitle('Desc: Val')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<CardItem label="X" value="Y" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
