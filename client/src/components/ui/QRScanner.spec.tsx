import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import QRScanner from './QRScanner'

const mocks = vi.hoisted(() => ({
  mockStart: vi.fn().mockResolvedValue(undefined),
  mockStop: vi.fn().mockResolvedValue(undefined),
  mockClear: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class Html5Qrcode {
    start = mocks.mockStart
    stop = mocks.mockStop
    clear = mocks.mockClear
  },
}))

function renderScanner(onScan = vi.fn(), onClose = vi.fn()) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(<QRScanner onScan={onScan} onClose={onClose} />)
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('QRScanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mocks.mockStart.mockReset().mockResolvedValue(undefined)
    mocks.mockStop.mockReset().mockResolvedValue(undefined)
    mocks.mockClear.mockReset().mockResolvedValue(undefined)
  })

  it('renders camera overlay with close button', () => {
    const { container, cleanup } = renderScanner()
    expect(container.textContent).toContain('Câmera')
    expect(container.textContent).toContain('Fechar')
    expect(container.textContent).toContain('Posicione o QR Code')
    cleanup()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const { container, cleanup } = renderScanner(vi.fn(), onClose)
    const closeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Fechar',
    ) as HTMLButtonElement
    await act(async () => { closeBtn.click() })
    expect(onClose).toHaveBeenCalled()
    cleanup()
  })

  it('shows camera error and auto-closes when scanner fails', async () => {
    mocks.mockStart.mockRejectedValueOnce(new Error('camera denied'))

    vi.useFakeTimers()
    const onClose = vi.fn()
    const { container, cleanup } = renderScanner(vi.fn(), onClose)

    await act(async () => { vi.advanceTimersByTime(0) })

    expect(container.textContent).toContain('Não foi possível acessar a câmera')

    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(onClose).toHaveBeenCalled()

    vi.useRealTimers()
    cleanup()
  })

  it('calls onScan when scan succeeds', async () => {
    const onScan = vi.fn()
    mocks.mockStart.mockImplementation(function (_source: unknown, _config: unknown, onSuccess: (text: string) => void) {
      return Promise.resolve().then(() => onSuccess('decoded-qr-text'))
    })

    const { cleanup } = renderScanner(onScan)
    await act(async () => {})

    expect(onScan).toHaveBeenCalledWith('decoded-qr-text')
    cleanup()
  })
})
