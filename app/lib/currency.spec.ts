import {
  getCurrencyFlag,
  convertToDisplayCurrency,
  formatCurrency,
  SUPPORTED_CURRENCIES,
} from './currency'

describe('getCurrencyFlag', () => {
  it('returns the flag emoji for a known currency', () => {
    expect(getCurrencyFlag('BRL')).toBe('🇧🇷')
    expect(getCurrencyFlag('USD')).toBe('🇺🇸')
    expect(getCurrencyFlag('EUR')).toBe('🇪🇺')
  })

  it('returns 💱 for an unknown currency code', () => {
    expect(getCurrencyFlag('XYZ')).toBe('💱')
    expect(getCurrencyFlag('')).toBe('💱')
  })
})

describe('SUPPORTED_CURRENCIES', () => {
  it('contains BRL, USD and EUR', () => {
    expect(SUPPORTED_CURRENCIES).toContain('BRL')
    expect(SUPPORTED_CURRENCIES).toContain('USD')
    expect(SUPPORTED_CURRENCIES).toContain('EUR')
  })
})

describe('convertToDisplayCurrency', () => {
  const rates = { BRL: 5.5, EUR: 0.9 } // base = USD

  it('returns the same amount when fromCurrency === displayCurrency', () => {
    expect(convertToDisplayCurrency(100, 'USD', 'USD', rates)).toBe(100)
  })

  it('converts BRL to USD correctly (amount / rate)', () => {
    // 550 BRL ÷ 5.5 = 100 USD
    expect(convertToDisplayCurrency(550, 'BRL', 'USD', rates)).toBeCloseTo(100)
  })

  it('converts EUR to USD correctly', () => {
    // 90 EUR ÷ 0.9 = 100 USD
    expect(convertToDisplayCurrency(90, 'EUR', 'USD', rates)).toBeCloseTo(100)
  })

  it('returns null when rate for fromCurrency is missing', () => {
    expect(convertToDisplayCurrency(100, 'JPY', 'USD', rates)).toBeNull()
  })

  it('returns null when rates object is empty', () => {
    expect(convertToDisplayCurrency(100, 'BRL', 'USD', {})).toBeNull()
  })

  it('handles zero amount', () => {
    expect(convertToDisplayCurrency(0, 'BRL', 'USD', rates)).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('formats BRL in pt-BR locale', () => {
    const result = formatCurrency(1500, 'BRL', 'pt-BR')
    expect(result).toContain('1.500')
    expect(result).toMatch(/R\$|BRL/)
  })

  it('formats USD', () => {
    const result = formatCurrency(1000, 'USD', 'en-US')
    expect(result).toContain('1,000')
    expect(result).toContain('$')
  })

  it('uses pt-BR as default locale', () => {
    const withDefault = formatCurrency(100, 'BRL')
    const withExplicit = formatCurrency(100, 'BRL', 'pt-BR')
    expect(withDefault).toBe(withExplicit)
  })
})
