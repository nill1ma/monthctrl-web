import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from './ChatInput'

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    render(<ChatInput onSend={jest.fn()} isLoading={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows send label when not loading', () => {
    render(<ChatInput onSend={jest.fn()} isLoading={false} />)
    expect(screen.getByRole('button')).toHaveTextContent('chat.send')
  })

  it('shows loading label when isLoading is true', () => {
    render(<ChatInput onSend={jest.fn()} isLoading={true} />)
    expect(screen.getByRole('button')).toHaveTextContent('chat.loading')
  })

  it('disables textarea and button while loading', () => {
    render(<ChatInput onSend={jest.fn()} isLoading={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onSend with the typed message on button click', async () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'Qual meu saldo?')
    await userEvent.click(screen.getByRole('button'))
    expect(onSend).toHaveBeenCalledWith('Qual meu saldo?')
  })

  it('clears the textarea after sending', async () => {
    render(<ChatInput onSend={jest.fn()} isLoading={false} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'teste')
    await userEvent.click(screen.getByRole('button'))
    expect(textarea).toHaveValue('')
  })

  it('does not call onSend when message is empty', async () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends message on Enter key (without Shift)', async () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'Olá')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('Olá')
  })

  it('does not send on Shift+Enter', async () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'linha 1')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })
})
