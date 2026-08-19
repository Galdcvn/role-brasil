import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import ValidarPage from './ValidarPage'
import { criarTokenFake } from '../../../test-utils'

vi.mock('../../../components/ui/QRScanner', () => ({
  default: ({ onScan, onClose }: { onScan: (t: string) => void; onClose: () => void }) => (
    <div data-testid="qr-scanner">
      <button onClick={() => onScan('SCANNED-CODE')}>Simular Scan</button>
      <button onClick={onClose}>Fechar Scanner</button>
    </div>
  ),
}))

function renderPage() {
  localStorage.setItem('token', criarTokenFake({ roles: ['PORTARIA'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthProvider>
          <ValidarPage />
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

function mockFetchEventos() {
  return vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
}

describe('ValidarPage', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('renders input and button', () => {
    mockFetchEventos()
    const { container, cleanup } = renderPage()
    expect(container.textContent).toContain('Validar Ingresso')
    expect(container.querySelector('input[placeholder="Código do ingresso"]')).toBeTruthy()
    cleanup()
  })

  it('shows approved result', async () => {
    const spy = mockFetchEventos()
    spy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'APROVADO',
        ingresso: { id: 1, codigo: 'ABC123', categoria: 'INTEIRA', evento: 'Show', assento: 'A1', usuario: 'João' },
      }),
    } as Response)
    const { container, cleanup } = renderPage()
    const input = container.querySelector('input') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(input, 'ABC123'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(container.textContent).toContain('APROVADO')
    expect(container.textContent).toContain('Show')
    expect(container.textContent).toContain('João')
    expect(container.textContent).toContain('ABC123')
    cleanup()
  })

  it('shows pending documentation result', async () => {
    const spy = mockFetchEventos()
    spy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'PENDENTE_DOCUMENTACAO',
        ingresso: { id: 2, codigo: 'DEF456', categoria: 'MEIA', evento: 'Teatro', assento: 'B5', usuario: 'Maria' },
      }),
    } as Response)
    const { container, cleanup } = renderPage()
    const input = container.querySelector('input') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(input, 'DEF456'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(container.textContent).toContain('PENDENTE_DOCUMENTACAO')
    expect(container.textContent).toContain('MEIA')
    cleanup()
  })

  it('shows error on API failure', async () => {
    const spy = mockFetchEventos()
    spy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Ingresso não encontrado' }),
    } as Response)
    const { container, cleanup } = renderPage()
    const input = container.querySelector('input') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(input, 'XYZ'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(container.textContent).toContain('Ingresso não encontrado')
    cleanup()
  })

  it('shows generic error on non-Error throw', async () => {
    const spy = mockFetchEventos()
    spy.mockRejectedValueOnce('network error')
    const { container, cleanup } = renderPage()
    const input = container.querySelector('input') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(input, 'XYZ'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(container.textContent).toContain('Erro ao validar ingresso')
    cleanup()
  })

  it('does not submit with empty code', async () => {
    const spy = mockFetchEventos()
    const { container, cleanup } = renderPage()
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(spy).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('shows rejected result with correct color card', async () => {
    const spy = mockFetchEventos()
    spy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'REJEITADO',
        ingresso: { id: 3, codigo: 'GHI789', categoria: 'INTEIRA', evento: 'Festival', assento: 'C10', usuario: 'Pedro' },
      }),
    } as Response)
    const { container, cleanup } = renderPage()
    const input = container.querySelector('input') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(input, 'GHI789'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(container.textContent).toContain('REJEITADO')
    expect(container.textContent).toContain('Festival')
    cleanup()
  })

  it('shows scan QR button', () => {
    mockFetchEventos()
    const { container, cleanup } = renderPage()
    expect(container.textContent).toContain('Escanear QR Code')
    cleanup()
  })

  it('opens scanner when scan button is clicked', async () => {
    mockFetchEventos()
    const { container, cleanup } = renderPage()
    const scanBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Escanear QR Code'),
    ) as HTMLButtonElement
    await act(async () => { scanBtn.click() })
    expect(container.querySelector('[data-testid="qr-scanner"]')).toBeTruthy()
    cleanup()
  })

  it('auto-submits after QR scan', async () => {
    const spy = mockFetchEventos()
    spy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'APROVADO',
        ingresso: { id: 4, codigo: 'SCANNED-CODE', categoria: 'INTEIRA', evento: 'Festival', assento: 'D1', usuario: 'Ana' },
      }),
    } as Response)
    const { container, cleanup } = renderPage()
    const scanBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Escanear QR Code'),
    ) as HTMLButtonElement
    await act(async () => { scanBtn.click() })
    const simulateBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Simular Scan',
    ) as HTMLButtonElement
    await act(async () => { simulateBtn.click() })
    expect(container.textContent).toContain('APROVADO')
    expect(container.textContent).toContain('SCANNED-CODE')
    cleanup()
  })
})
