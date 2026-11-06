import { renderHook } from '@testing-library/react'
import { useTransactionCharts } from './useTransactionCharts'

const incomings = [
  { currency: 'BRL', value: 1000 },
  { currency: 'BRL', value: 500 },
  { currency: 'USD', value: 200 },
]

const expenses = [
  { currency: 'BRL', value: 300 },
  { currency: 'USD', value: 50 },
]

describe('useTransactionCharts', () => {
  it('returns empty array when no data', () => {
    const { result } = renderHook(() => useTransactionCharts())
    expect(result.current.currencyGroups).toEqual([])
  })

  it('groups incomings by currency', () => {
    const { result } = renderHook(() => useTransactionCharts(incomings as any, []))
    const brl = result.current.currencyGroups.find(g => g.currency === 'BRL')
    expect(brl?.incomings).toBe(1500)
  })

  it('groups expenses by currency', () => {
    const { result } = renderHook(() => useTransactionCharts([], expenses as any))
    const brl = result.current.currencyGroups.find(g => g.currency === 'BRL')
    expect(brl?.expenses).toBe(300)
  })

  it('calculates netIncome correctly', () => {
    const { result } = renderHook(() => useTransactionCharts(incomings as any, expenses as any))
    const brl = result.current.currencyGroups.find(g => g.currency === 'BRL')
    expect(brl?.netIncome).toBe(1200) // 1500 - 300
    const usd = result.current.currencyGroups.find(g => g.currency === 'USD')
    expect(usd?.netIncome).toBe(150) // 200 - 50
  })

  it('defaults missing currency to BRL', () => {
    const { result } = renderHook(() =>
      useTransactionCharts([{ value: 100 }] as any, [])
    )
    expect(result.current.currencyGroups[0].currency).toBe('BRL')
  })

  it('handles null values as 0', () => {
    const { result } = renderHook(() =>
      useTransactionCharts([{ currency: 'BRL', value: null }] as any, [])
    )
    expect(result.current.currencyGroups[0].incomings).toBe(0)
  })
})
