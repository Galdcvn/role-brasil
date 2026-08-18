import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import RelatoriosPage from './RelatoriosPage'
import { criarTokenFake } from '../../../test-utils'

const MOCK_EVENTOS = [
  { id: 1, titulo: 'Show', status: 'PUBLICADO', _count: { sessoes: 2 } },
]

const MOCK_DETALHE = {
  id: 1,
  titulo: 'Show',
  status: 'PUBLICADO',
  _count: { sessoes: 2 },
  metricas: {
    reservasTotais: 20,
    valorArrecadado: 100000,
    reservasPorSessao: [{ sessaoId: 1, reservas: 12, valor: 60000 }, { sessaoId: 2, reservas: 8, valor: 40000 }],
    ingressosPorCategoria: [{ categoria: 'INTEIRA', count: 15 }, { categoria: 'MEIA', count: 5 }],
  },
}

describe('RelatoriosPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/portal/organizador/relatorios']}>
          <AuthProvider>
            <PortalProvider>
              <RelatoriosPage />
            </PortalProvider>
          </AuthProvider>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Relat')
    act(() => root.unmount())
    container.remove()
  })

  it('renders reports with metrics', async () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    let call = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      call++
      const data = call === 1 ? MOCK_EVENTOS : MOCK_DETALHE
      return Promise.resolve({ ok: true, json: async () => data } as Response)
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/portal/organizador/relatorios']}>
          <AuthProvider>
            <PortalProvider>
              <RelatoriosPage />
            </PortalProvider>
          </AuthProvider>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Relat')
    expect(container.textContent).toContain('Reservas Totais')
    expect(container.textContent).toContain('20')
    expect(container.textContent).toContain('R$ 1000,00')
    act(() => root.unmount())
    container.remove()
  })

  it('shows per-session metrics', async () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    let call = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      call++
      const data = call === 1 ? MOCK_EVENTOS : MOCK_DETALHE
      return Promise.resolve({ ok: true, json: async () => data } as Response)
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/portal/organizador/relatorios']}>
          <AuthProvider>
            <PortalProvider>
              <RelatoriosPage />
            </PortalProvider>
          </AuthProvider>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Reservas por')
    expect(container.textContent).toContain('12 reservas')
    expect(container.textContent).toContain('8 reservas')
    act(() => root.unmount())
    container.remove()
  })

  it('shows per-category metrics', async () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    let call = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      call++
      const data = call === 1 ? MOCK_EVENTOS : MOCK_DETALHE
      return Promise.resolve({ ok: true, json: async () => data } as Response)
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/portal/organizador/relatorios']}>
          <AuthProvider>
            <PortalProvider>
              <RelatoriosPage />
            </PortalProvider>
          </AuthProvider>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Ingressos por Categoria')
    expect(container.textContent).toContain('INTEIRA')
    expect(container.textContent).toContain('MEIA')
    act(() => root.unmount())
    container.remove()
  })

  it('shows empty state when no events', async () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/portal/organizador/relatorios']}>
          <AuthProvider>
            <PortalProvider>
              <RelatoriosPage />
            </PortalProvider>
          </AuthProvider>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Nenhum evento criado ainda')
    act(() => root.unmount())
    container.remove()
  })
})
