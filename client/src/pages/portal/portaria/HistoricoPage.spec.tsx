import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import HistoricoPage from './HistoricoPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage() {
  localStorage.setItem('token', criarTokenFake({ roles: ['PORTARIA'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(<HistoricoPage />)
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

const MOCK_SCANS = [
  {
    portariaId: 1, ingressoId: 1, resultado: 'APROVADO', observacao: null,
    criadoEm: '2026-08-19T20:00:00Z',
    ingresso: {
      id: 1, codigo: 'ABC123', categoria: 'INTEIRA', status: 'USADO', comprovanteStatus: 'NAO_NECESSARIO',
      reserva: { sessao: { id: 1, dataHora: '2026-08-20T20:00:00Z', evento: { id: 1, titulo: 'Show', posterUrl: null } } },
    },
  },
  {
    portariaId: 1, ingressoId: 2, resultado: 'PENDENTE_DOCUMENTACAO', observacao: null,
    criadoEm: '2026-08-19T20:05:00Z',
    ingresso: {
      id: 2, codigo: 'DEF456', categoria: 'MEIA', status: 'EMITIDO', comprovanteStatus: 'PENDENTE',
      reserva: { sessao: { id: 1, dataHora: '2026-08-20T20:00:00Z', evento: { id: 1, titulo: 'Show', posterUrl: null } } },
    },
  },
]

describe('HistoricoPage', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('shows loading state', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))
    const { container, cleanup } = renderPage()
    expect(container.textContent).toContain('Histórico')
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    cleanup()
  })

  it('renders scan history', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => MOCK_SCANS } as Response)
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Show')
    expect(container.textContent).toContain('APROVADO')
    expect(container.textContent).toContain('PENDENTE_DOCUMENTACAO')
    expect(container.textContent).toContain('INTEIRA')
    expect(container.textContent).toContain('MEIA')
    cleanup()
  })

  it('shows empty state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Nenhum scan realizado ainda')
    cleanup()
  })

  it('shows error on API failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro' }) } as Response)
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    cleanup()
  })

  it('handles non-Error exception', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('network error')
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    cleanup()
  })
})
