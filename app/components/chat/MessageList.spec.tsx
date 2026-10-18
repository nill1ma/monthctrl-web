window.HTMLElement.prototype.scrollIntoView = jest.fn()

import { render, screen } from '@testing-library/react'
import MessageList from './MessageList'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

const userMsg: Message = { id: '1', role: 'user', content: 'Olá' }
const assistantMsg: Message = { id: '2', role: 'assistant', content: 'Tudo bem!' }

describe('MessageList', () => {
  it('shows welcome message when messages is empty', () => {
    render(<MessageList messages={[]} isLoading={false} />)
    expect(screen.getByText('chat.welcome')).toBeInTheDocument()
  })

  it('renders user and assistant messages', () => {
    render(<MessageList messages={[userMsg, assistantMsg]} isLoading={false} />)
    expect(screen.getByText('Olá')).toBeInTheDocument()
    expect(screen.getByText('Tudo bem!')).toBeInTheDocument()
  })

  it('shows loading indicator when isLoading is true', () => {
    render(<MessageList messages={[userMsg]} isLoading={true} />)
    // 3 dots animados
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(3)
  })

  it('does not show loading indicator when isLoading is false', () => {
    render(<MessageList messages={[userMsg]} isLoading={false} />)
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(0)
  })

  it('does not show welcome message when there are messages', () => {
    render(<MessageList messages={[userMsg]} isLoading={false} />)
    expect(screen.queryByText('chat.welcome')).not.toBeInTheDocument()
  })
})
