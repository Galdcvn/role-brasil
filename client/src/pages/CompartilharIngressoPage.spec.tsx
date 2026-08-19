import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CompartilharIngressoPage from './CompartilharIngressoPage'

const MOCK_INGRESSO = {
  codigo: 'ABC123DEF456GHIJ',
  status: 'EMITIDO',
  categoria: 'INTEIRA',
  criadoEm: '2026-09-15T10:00:00.000Z',
  qrDataUrl: 'data:image/png;base64,FAKEQR',
  assento: { fileira: 'A', numero: 5 },
  reserva: {
    sessao: {
      dataHora: '2026-09-15T20:00:00.000Z',
      evento: {
        titulo: 'Rock in Rio',
        posterUrl: 'https://example.com/poster.jpg',
        endereco: { cidade: 'Rio de Janeiro', estado: 'RJ' },
      },
    },
    itens: [{ categoria: 'INTEIRA', precoCentavos: 35000 }],
  },
}

function renderPage(codigo = 'ABC123DEF456GHIJ') {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[`/ingressos/compartilhar/${codigo}`]}>
        <Routes>
          <Route path="/ingressos/compartilhar/:codigo" element={<CompartilharIngressoPage />} />
        </Routes>
      </MemoryRouter>,
    )
  })
  return { container, root }
}

function cleanup(root: ReturnType<typeof createRoot>, container: HTMLElement) {
  act(() => root.unmount())
  container.remove()
}

describe('CompartilharIngressoPage', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('shows loading skeleton while fetching', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    const { container, root } = renderPage()
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup(root, container)
  })

  it('renders ticket details on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_INGRESSO,
    } as Response)
    const { container, root } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock in Rio')
    expect(container.textContent).toContain('ABC123DEF456GHIJ')
    expect(container.textContent).toContain('INTEIRA')
    expect(container.textContent).toContain('R$ 350,00')
    expect(container.textContent).toContain('A5')
    expect(container.textContent).toContain('Rio de Janeiro/RJ')
    expect(container.querySelector('img[src*="data:image/png"]')).toBeTruthy()
    cleanup(root, container)
  })

  it('shows error state on API failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Ingresso não encontrado' }),
    } as Response)
    const { container, root } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Ingresso não encontrado')
    cleanup(root, container)
  })

  it('shows generic error on non-Error throw', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('network error')
    const { container, root } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Ingresso não encontrado')
    cleanup(root, container)
  })

  it('handles ticket without assento', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...MOCK_INGRESSO, assento: null }),
    } as Response)
    const { container, root } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock in Rio')
    expect(container.textContent).not.toContain('Assento')
    cleanup(root, container)
  })

  it('handles ticket without endereco', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...MOCK_INGRESSO,
        reserva: {
          ...MOCK_INGRESSO.reserva,
          sessao: {
            ...MOCK_INGRESSO.reserva.sessao,
            evento: { ...MOCK_INGRESSO.reserva.sessao.evento, endereco: null },
          },
        },
      }),
    } as Response)
    const { container, root } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock in Rio')
    expect(container.textContent).not.toContain('RJ')
    cleanup(root, container)
  })

  it('handles ticket without posterUrl', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...MOCK_INGRESSO,
        reserva: {
          ...MOCK_INGRESSO.reserva,
          sessao: {
            ...MOCK_INGRESSO.reserva.sessao,
            evento: { ...MOCK_INGRESSO.reserva.sessao.evento, posterUrl: null },
          },
        },
      }),
    } as Response)
    const { container, root } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock in Rio')
    expect(container.querySelector('img[alt="Rock in Rio"]')).toBeNull()
    cleanup(root, container)
  })

  it('does not fetch when codigo is undefined', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const { container, root } = renderPage('')
    await act(async () => {})
    expect(spy).not.toHaveBeenCalled()
    cleanup(root, container)
  })
})
