import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastProvider, useToast } from './ToastContext'

function ToastConsumer() {
  const toast = useToast()
  return (
    <div>
      <button data-testid="success" onClick={() => toast.success('OK!')}>success</button>
      <button data-testid="error" onClick={() => toast.error('Fail!')}>error</button>
      <button data-testid="info" onClick={() => toast.info('Heads up')}>info</button>
    </div>
  )
}

function renderWithToast(ui: React.ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(<ToastProvider>{ui}</ToastProvider>)
  })
  return { container, root }
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    const { container, root } = renderWithToast(<span>child</span>)
    expect(container.textContent).toContain('child')
    act(() => root.unmount())
  })

  it('shows success toast', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="success"]') as HTMLButtonElement)!.click() })
    expect(container.textContent).toContain('OK!')
    act(() => root.unmount())
  })

  it('shows error toast', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="error"]') as HTMLButtonElement)!.click() })
    expect(container.textContent).toContain('Fail!')
    act(() => root.unmount())
  })

  it('shows info toast', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="info"]') as HTMLButtonElement)!.click() })
    expect(container.textContent).toContain('Heads up')
    act(() => root.unmount())
  })

  it('auto-dismisses after 4 seconds', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="success"]') as HTMLButtonElement)!.click() })
    expect(container.textContent).toContain('OK!')

    act(() => { vi.advanceTimersByTime(4000) })
    expect(container.textContent).not.toContain('OK!')
    act(() => root.unmount())
  })

  it('does not dismiss before 4 seconds', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="success"]') as HTMLButtonElement)!.click() })

    act(() => { vi.advanceTimersByTime(3999) })
    expect(container.textContent).toContain('OK!')
    act(() => root.unmount())
  })

  it('shows multiple toasts', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="success"]') as HTMLButtonElement)!.click() })
    act(() => { (container.querySelector('[data-testid="error"]') as HTMLButtonElement)!.click() })
    expect(container.textContent).toContain('OK!')
    expect(container.textContent).toContain('Fail!')
    act(() => root.unmount())
  })

  it('dismisses each toast independently', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="success"]') as HTMLButtonElement)!.click() })
    act(() => { vi.advanceTimersByTime(1000) })
    act(() => { (container.querySelector('[data-testid="error"]') as HTMLButtonElement)!.click() })

    act(() => { vi.advanceTimersByTime(3000) })
    expect(container.textContent).not.toContain('OK!')
    expect(container.textContent).toContain('Fail!')

    act(() => { vi.advanceTimersByTime(1000) })
    expect(container.textContent).not.toContain('Fail!')
    act(() => root.unmount())
  })

  it('throws when useToast is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Bad() {
      useToast()
      return null
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    expect(() => {
      act(() => { root.render(<Bad />) })
    }).toThrow('useToast deve ser usado dentro de ToastProvider')
    spy.mockRestore()
  })

  it('renders success toast with correct styling', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="success"]') as HTMLButtonElement)!.click() })
    const toast = container.querySelector('.bg-emerald-600')
    expect(toast).toBeTruthy()
    expect(toast!.textContent).toContain('OK!')
    act(() => root.unmount())
  })

  it('renders error toast with correct styling', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="error"]') as HTMLButtonElement)!.click() })
    const toast = container.querySelector('.bg-red-600')
    expect(toast).toBeTruthy()
    expect(toast!.textContent).toContain('Fail!')
    act(() => root.unmount())
  })

  it('renders info toast with correct styling', () => {
    const { container, root } = renderWithToast(<ToastConsumer />)
    act(() => { (container.querySelector('[data-testid="info"]') as HTMLButtonElement)!.click() })
    const toast = container.querySelector('.bg-slate-700')
    expect(toast).toBeTruthy()
    expect(toast!.textContent).toContain('Heads up')
    act(() => root.unmount())
  })
})
