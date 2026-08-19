import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import QRScanner from './QRScanner'

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    start = vi.fn().mockResolvedValue(undefined)
    stop = vi.fn().mockResolvedValue(undefined)
    clear = vi.fn().mockResolvedValue(undefined)
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
  beforeEach(() => { vi.restoreAllMocks() })

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
})
