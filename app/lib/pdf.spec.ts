import {
  buildDetailsPdfHtml,
  buildExportPdfHtml,
  getReferencesInRange,
} from './pdf'

// ─── buildDetailsPdfHtml ─────────────────────────────────────────────────────

describe('buildDetailsPdfHtml', () => {
  const base = {
    reference: '2024-01',
    incomings: [{ label: 'Salary', value: 5000, currency: 'BRL' }],
    expenses: [{ label: 'Rent', value: 2000, currency: 'BRL' }],
  }

  it('includes the reference in the output', () => {
    const html = buildDetailsPdfHtml(base)
    expect(html).toContain('2024-01')
  })

  it('includes incoming labels', () => {
    const html = buildDetailsPdfHtml(base)
    expect(html).toContain('Salary')
  })

  it('includes expense labels', () => {
    const html = buildDetailsPdfHtml(base)
    expect(html).toContain('Rent')
  })

  it('renders the currency badge', () => {
    const html = buildDetailsPdfHtml(base)
    expect(html).toContain('BRL')
  })

  it('renders sections for each currency present', () => {
    const html = buildDetailsPdfHtml({
      reference: '2024-01',
      incomings: [{ label: 'Salary', value: 5000, currency: 'BRL' }],
      expenses: [{ label: 'Netflix', value: 30, currency: 'USD' }],
    })
    expect(html).toContain('BRL')
    expect(html).toContain('USD')
  })

  it('skips incomings section when there are none for a currency', () => {
    const html = buildDetailsPdfHtml({
      reference: '2024-01',
      incomings: [],
      expenses: [{ label: 'Rent', value: 2000, currency: 'BRL' }],
    })
    expect(html).not.toContain('Incomings')
  })

  it('skips expenses section when there are none for a currency', () => {
    const html = buildDetailsPdfHtml({
      reference: '2024-01',
      incomings: [{ label: 'Salary', value: 5000, currency: 'BRL' }],
      expenses: [],
    })
    expect(html).not.toContain('Expenses')
  })

  it('is a valid HTML document', () => {
    const html = buildDetailsPdfHtml(base)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })
})

// ─── buildExportPdfHtml ──────────────────────────────────────────────────────

describe('buildExportPdfHtml', () => {
  const data = [
    { reference: '2024-01', description: 'Salary', value: 5000, currency: 'BRL', type: 'incoming' as const },
    { reference: '2024-01', description: 'Rent',   value: 2000, currency: 'BRL', type: 'expense'  as const },
    { reference: '2024-02', description: 'Bonus',  value: 1000, currency: 'USD', type: 'incoming' as const },
  ]

  const baseFilters = {
    referenceStart: '2024-01',
    referenceEnd: '2024-02',
    transactionType: 'all' as const,
  }

  it('includes all descriptions when type is "all"', () => {
    const html = buildExportPdfHtml(data, baseFilters)
    expect(html).toContain('Salary')
    expect(html).toContain('Rent')
    expect(html).toContain('Bonus')
  })

  it('includes both references', () => {
    const html = buildExportPdfHtml(data, baseFilters)
    expect(html).toContain('2024-01')
    expect(html).toContain('2024-02')
  })

  it('shows only incomings when type is "incoming"', () => {
    const html = buildExportPdfHtml(data, { ...baseFilters, transactionType: 'incoming' })
    expect(html).toContain('Salary')
    expect(html).toContain('Bonus')
    expect(html).not.toContain('Rent')
  })

  it('shows only expenses when type is "expense"', () => {
    const html = buildExportPdfHtml(data, { ...baseFilters, transactionType: 'expense' })
    expect(html).toContain('Rent')
    expect(html).not.toContain('Salary')
    expect(html).not.toContain('Bonus')
  })

  it('does not show balance row when type is not "all"', () => {
    const html = buildExportPdfHtml(data, { ...baseFilters, transactionType: 'incoming' })
    expect(html).not.toContain('<tr class="balance-row">')
  })

  it('shows balance row when type is "all"', () => {
    const html = buildExportPdfHtml(data, baseFilters)
    expect(html).toContain('<tr class="balance-row">')
  })

  it('is a valid HTML document', () => {
    const html = buildExportPdfHtml(data, baseFilters)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })
})

// ─── getReferencesInRange ────────────────────────────────────────────────────

describe('getReferencesInRange', () => {
  it('returns a single reference when start equals end', () => {
    expect(getReferencesInRange('2024-03', '2024-03')).toEqual(['2024-03'])
  })

  it('returns all months within the same year', () => {
    const refs = getReferencesInRange('2024-01', '2024-03')
    expect(refs).toEqual(['2024-01', '2024-02', '2024-03'])
  })

  it('crosses year boundary correctly', () => {
    const refs = getReferencesInRange('2023-11', '2024-02')
    expect(refs).toEqual(['2023-11', '2023-12', '2024-01', '2024-02'])
  })

  it('returns references in ascending order', () => {
    const refs = getReferencesInRange('2024-01', '2024-06')
    const sorted = [...refs].sort((a, b) => a.localeCompare(b))
    expect(refs).toEqual(sorted)
  })

  it('pads month with leading zero', () => {
    const refs = getReferencesInRange('2024-01', '2024-01')
    expect(refs[0]).toBe('2024-01')
  })
})
