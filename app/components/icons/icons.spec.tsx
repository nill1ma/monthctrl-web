import { render } from '@testing-library/react'
import {
  ArrowCircleLeftIcon,
  FileDownloadIcon,
  DeleteForeverIcon,
  EditNoteIcon,
  Spinner,
} from './index'

describe('Icon components', () => {
  it.each([
    ['ArrowCircleLeftIcon', ArrowCircleLeftIcon],
    ['FileDownloadIcon', FileDownloadIcon],
    ['DeleteForeverIcon', DeleteForeverIcon],
    ['EditNoteIcon', EditNoteIcon],
  ])('%s renders an svg', (_, Icon) => {
    const { container } = render(<Icon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('Spinner renders an svg', () => {
    const { container } = render(<Spinner size={24} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('Spinner accepts custom size', () => {
    const { container } = render(<Spinner size={40} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('40')
    expect(svg?.getAttribute('height')).toBe('40')
  })

  it('icons are hidden from accessibility tree', () => {
    const { container } = render(<ArrowCircleLeftIcon />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
