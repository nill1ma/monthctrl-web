import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportPdfModal } from './ExportPdfModal'

// ── i18n ────────────────────────────────────────────────────────────────────
jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}))

// ── awake-ui Dialog ─────────────────────────────────────────────────────────
jest.mock('@developmentsnil/awake-ui/dialog', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const DialogCloseCtx = React.createContext<() => void>(() => {})

  return {
    Dialog: {
      Root: ({ open, onOpenChange, children }: { open: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }) => {
        const close = () => onOpenChange?.(false)
        return open
          ? <DialogCloseCtx.Provider value={close}><div>{children}</div></DialogCloseCtx.Provider>
          : null
      },
      Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Backdrop: () => <div />,
      Popup: ({ children, className }: { children: React.ReactNode; className?: string }) =>
        <div className={className}>{children}</div>,
      Title: ({ children, className }: { children: React.ReactNode; className?: string }) =>
        <h2 className={className}>{children}</h2>,
      Close: ({ render: r }: { render: React.ReactElement }) => {
        const close = React.useContext(DialogCloseCtx)
        return React.cloneElement(r, { onClick: close })
      },
    },
  }
})

jest.mock('@developmentsnil/awake-ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    <button onClick={onClick} disabled={disabled}>{children}</button>,
}))

jest.mock('@/app/lib/currency', () => ({
  SUPPORTED_CURRENCIES: ['BRL', 'USD', 'EUR'],
  getCurrencyFlag: (c: string) => c,
}))

// ── helpers ──────────────────────────────────────────────────────────────────
const availableReferences = ['2024-01', '2024-02', '2024-03']

function renderModal(overrides = {}) {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onExport: jest.fn().mockResolvedValue(undefined),
    isExporting: false,
    availableReferences,
    ...overrides,
  }
  return { ...render(<ExportPdfModal {...defaultProps} />), props: defaultProps }
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('ExportPdfModal', () => {
  it('renders nothing when open is false', () => {
    renderModal({ open: false })
    expect(screen.queryByText('export.modal.title')).not.toBeInTheDocument()
  })

  it('renders the title when open', () => {
    renderModal()
    expect(screen.getByText('export.modal.title')).toBeInTheDocument()
  })

  it('renders reference start and end selects', () => {
    renderModal()
    expect(screen.getByText('export.modal.referenceStart')).toBeInTheDocument()
    expect(screen.getByText('export.modal.referenceEnd')).toBeInTheDocument()
  })

  it('renders transaction type buttons', () => {
    renderModal()
    expect(screen.getByText('export.modal.type.all')).toBeInTheDocument()
    expect(screen.getByText('export.modal.type.incoming')).toBeInTheDocument()
    expect(screen.getByText('export.modal.type.expense')).toBeInTheDocument()
  })

  it('renders currency toggle buttons', () => {
    renderModal()
    expect(screen.getByText('BRL BRL')).toBeInTheDocument()
    expect(screen.getByText('USD USD')).toBeInTheDocument()
    expect(screen.getByText('EUR EUR')).toBeInTheDocument()
  })

  it('calls onExport with correct default filters when confirm is clicked', async () => {
    const user = userEvent.setup()
    const { props } = renderModal()

    await user.click(screen.getByText('export.modal.confirm'))

    expect(props.onExport).toHaveBeenCalledWith({
      referenceStart: '2024-01',
      referenceEnd: '2024-03',
      transactionType: 'all',
      currencies: 'all',
    })
  })

  it('calls onExport with selected currencies when some are toggled', async () => {
    const user = userEvent.setup()
    const { props } = renderModal()

    await user.click(screen.getByText('BRL BRL'))
    await user.click(screen.getByText('export.modal.confirm'))

    expect(props.onExport).toHaveBeenCalledWith(
      expect.objectContaining({ currencies: ['BRL'] })
    )
  })

  it('calls onExport with correct transactionType when changed', async () => {
    const user = userEvent.setup()
    const { props } = renderModal()

    await user.click(screen.getByText('export.modal.type.expense'))
    await user.click(screen.getByText('export.modal.confirm'))

    expect(props.onExport).toHaveBeenCalledWith(
      expect.objectContaining({ transactionType: 'expense' })
    )
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const { props } = renderModal()

    await user.click(screen.getByText('login.cancel'))

    expect(props.onClose).toHaveBeenCalled()
  })

  it('disables buttons while exporting', () => {
    renderModal({ isExporting: true })
    const buttons = screen.getAllByRole('button')
    const disabledButtons = buttons.filter((b) => b.hasAttribute('disabled'))
    expect(disabledButtons.length).toBeGreaterThan(0)
  })
})
