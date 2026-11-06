import { render, screen } from '@testing-library/react'
import Loading from './loading'

describe('Loading', () => {
  it('renders three dots', () => {
    const { container } = render(<Loading />)
    const dots = container.querySelectorAll('.dot')
    expect(dots).toHaveLength(3)
  })

  it('renders loading container', () => {
    const { container } = render(<Loading />)
    expect(container.querySelector('.loading-container')).toBeInTheDocument()
  })
})
