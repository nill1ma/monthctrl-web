import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeProvider'

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>set dark</button>
      <button onClick={() => setTheme('light')}>set light</button>
      <button onClick={() => setTheme('system')}>set system</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
  })
})

describe('ThemeProvider', () => {
  it('defaults to system theme', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  it('resolves to light when matchMedia does not match dark', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('resolved').textContent).toBe('light')
  })

  it('resolves to dark when matchMedia matches dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
    })
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
  })

  it('sets dark theme and applies data-theme attribute', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    await user.click(screen.getByText('set dark'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('persists theme to localStorage', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    await user.click(screen.getByText('set dark'))
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('throws when useTheme is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow()
    spy.mockRestore()
  })
})
