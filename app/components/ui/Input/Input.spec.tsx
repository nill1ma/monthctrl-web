import { render, screen } from '@testing-library/react'
import Input from './Input'

describe('Input', () => {
  it('renders label and input', () => {
    render(<Input label="Nome" id="name" />)
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('passes props to input element', () => {
    render(<Input label="Email" id="email" type="email" placeholder="email@test.com" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('placeholder', 'email@test.com')
  })

  it('applies containerClassName', () => {
    const { container } = render(<Input label="X" id="x" containerClassName="my-container" />)
    expect(container.firstChild).toHaveClass('my-container')
  })

  it('applies inputClassName to input', () => {
    render(<Input label="X" id="x2" inputClassName="my-input" />)
    expect(screen.getByLabelText('X')).toHaveClass('my-input')
  })
})
