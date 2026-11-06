import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteReferenceDialog } from './DeleteReferenceDialog'

jest.mock('@awakr/awake-ui/dialog', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const Ctx = React.createContext<() => void>(() => {})
  return {
    Dialog: {
      Root: ({ open, onOpenChange, children }: any) =>
        open ? <Ctx.Provider value={() => onOpenChange?.(false)}><div>{children}</div></Ctx.Provider> : null,
      Portal: ({ children }: any) => <div>{children}</div>,
      Backdrop: () => <div />,
      Popup: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <h2>{children}</h2>,
      Description: ({ children }: any) => <p>{children}</p>,
      Close: ({ render: r }: any) => {
        const close = React.useContext(Ctx)
        return React.cloneElement(r, { onClick: close })
      },
    },
  }
})

jest.mock('@awakr/awake-ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    <button onClick={onClick} disabled={disabled}>{children}</button>,
}))

function setup(overrides = {}) {
  const props = {
    reference: '2024-01',
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn().mockResolvedValue(undefined),
    isDeleting: false,
    ...overrides,
  }
  render(<DeleteReferenceDialog {...props} />)
  return props
}

describe('DeleteReferenceDialog', () => {
  it('renders nothing when closed', () => {
    setup({ open: false })
    expect(screen.queryByText('delete.dialog.title')).not.toBeInTheDocument()
  })

  it('renders title with reference', () => {
    setup()
    expect(screen.getByText(/delete\.dialog\.title/)).toBeInTheDocument()
    expect(screen.getByText(/2024-01/)).toBeInTheDocument()
  })

  it('renders description', () => {
    setup()
    expect(screen.getByText('delete.dialog.description')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(screen.getByText('delete.dialog.confirm'))
    expect(props.onConfirm).toHaveBeenCalled()
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(screen.getByText('delete.dialog.cancel'))
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables confirm button while deleting', () => {
    setup({ isDeleting: true })
    expect(screen.getByText('delete.dialog.confirm.loading')).toBeDisabled()
  })
})
