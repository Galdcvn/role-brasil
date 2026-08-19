import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import ValidarPage from './ValidarPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage() {
  localStorage.setItem('token', criarTokenFake({ roles: ['PORTARIA'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(<ValidarPage />)
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('ValidarPage', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('renders input and button', () => {
    const { container, cleanup } = renderPage()
    expect(container.textContent).toContain('Validar Ingresso')
    expect(container.querySelector('input[placeholder="Código do ingresso"]')).toBeTruthy()
    cleanup()
  })

  it('shows approved result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
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
    expect(container.textContent).toContain('Aprovado')
    expect(container.textContent).toContain('Show')
    expect(container.textContent).toContain('João')
    expect(container.textContent).toContain('ABC123')
    cleanup()
  })

  it('shows pending documentation result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
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
    expect(container.textContent).toContain('Pendente Documentação')
    expect(container.textContent).toContain('MEIA')
    cleanup()
  })

  it('shows error on API failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
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
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('network error')
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
    const spy = vi.spyOn(globalThis, 'fetch')
    const { container, cleanup } = renderPage()
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
    expect(spy).not.toHaveBeenCalled()
    cleanup()
  })

  it('shows rejected result with correct color card', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
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
    expect(container.textContent).toContain('Rejeitado')
    expect(container.textContent).toContain('Festival')
    cleanup()
  })
})
