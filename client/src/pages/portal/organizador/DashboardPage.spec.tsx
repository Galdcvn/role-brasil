import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import DashboardPage from './DashboardPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage() {
  localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/portal/organizador']}>
        <AuthProvider>
          <PortalProvider>
            <DashboardPage />
          </PortalProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

function mockFetchMulti(responses: unknown[]) {
  let call = 0
  return vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    const data = responses[call++] ?? responses[responses.length - 1]
    return Promise.resolve({ ok: true, json: async () => data } as Response)
  })
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', () => {
    mockFetchMulti([new Promise(() => {}), new Promise(() => {})])
    const { container, cleanup } = renderPage()
    expect(container.textContent).toContain('Dashboard')
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('shows empty state when no events', async () => {
    mockFetchMulti([
      { totalEventos: 0, eventosPorStatus: {}, totalReservas: 0, totalReceitaCentavos: 0, totalIngressos: 0 },
      [],
    ])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Bem-vindo ao Rolê Brasil')
    cleanup()
  })

  it('renders KPI cards with data', async () => {
    mockFetchMulti([
      { totalEventos: 3, eventosPorStatus: { PUBLICADO: 2, RASCUNHO: 1 }, totalReservas: 15, totalReceitaCentavos: 75000, totalIngressos: 12 },
      [],
    ])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('3')
    expect(container.textContent).toContain('15')
    expect(container.textContent).toContain('12')
    expect(container.textContent).toContain('R$ 750,00')
    cleanup()
  })

  it('shows event status breakdown', async () => {
    mockFetchMulti([
      { totalEventos: 3, eventosPorStatus: { PUBLICADO: 2, RASCUNHO: 1 }, totalReservas: 0, totalReceitaCentavos: 0, totalIngressos: 0 },
      [],
    ])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Por Status')
    expect(container.textContent).toContain('PUBLICADO')
    expect(container.textContent).toContain('RASCUNHO')
    cleanup()
  })

  it('shows recent events', async () => {
    mockFetchMulti([
      { totalEventos: 1, eventosPorStatus: { PUBLICADO: 1 }, totalReservas: 5, totalReceitaCentavos: 10000, totalIngressos: 4 },
      [{ id: 1, titulo: 'Meu Show', posterUrl: null, status: 'PUBLICADO', criadoEm: '2026-08-18', _count: { sessoes: 2 } }],
    ])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Últimos Eventos')
    expect(container.textContent).toContain('Meu Show')
    expect(container.textContent).toContain('2 sessões')
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network'))
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Network')
    cleanup()
  })
})
