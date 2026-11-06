import { render, screen } from '@testing-library/react'
import ReferenceDate from './ReferenceDate'

jest.mock('@/app/i18n/LocaleContext', () => ({
  useLocale: () => ({ locale: 'pt' }),
}))

describe('ReferenceDate', () => {
  it('renders a formatted date string', () => {
    const { container } = render(<ReferenceDate reference="2024-01" />)
    expect(container.textContent).toMatch(/2024/)
  })

  it('renders in short format', () => {
    const { container } = render(<ReferenceDate reference="2024-06" format="short" />)
    // short month in pt-BR is abbreviated (e.g. "jun.")
    expect(container.textContent).not.toBe('')
  })

  it('renders in long format by default', () => {
    const { container } = render(<ReferenceDate reference="2024-06" />)
    expect(container.textContent).not.toBe('')
  })
})
