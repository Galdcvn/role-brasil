import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import EventosPage from './EventosPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage(entry: string) {
  localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <AuthProvider>
          <PortalProvider>
            <EventosPage />
          </PortalProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

function mockFetch(data: unknown, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok, json: async () => data } as Response)
}

describe('EventosPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', () => {
    mockFetch(new Promise(() => {}))
    const { container, cleanup } = renderPage('/portal/organizador/eventos')
    expect(container.textContent).toContain('Meus Eventos')
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('shows empty state when no events', async () => {
    mockFetch([])
    const { container, cleanup } = renderPage('/portal/organizador/eventos')
    await act(async () => {})
    expect(container.textContent).toContain('Nenhum evento criado')
    cleanup()
  })

  it('renders event list', async () => {
    mockFetch([
      { id: 1, titulo: 'Show Rock', posterUrl: null, status: 'PUBLICADO', criadoEm: '2026-08-18', _count: { sessoes: 3 } },
      { id: 2, titulo: 'Festa', posterUrl: 'https://img.test/poster.jpg', status: 'RASCUNHO', criadoEm: '2026-08-17', _count: { sessoes: 1 } },
    ])
    const { container, cleanup } = renderPage('/portal/organizador/eventos')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    expect(container.textContent).toContain('Festa')
    expect(container.textContent).toContain('3 sessões')
    expect(container.querySelector('img[src="https://img.test/poster.jpg"]')).toBeTruthy()
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    mockFetch({ message: 'Erro' }, false)
    const { container, cleanup } = renderPage('/portal/organizador/eventos')
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    cleanup()
  })

  it('has link to create event', async () => {
    mockFetch([])
    const { container, cleanup } = renderPage('/portal/organizador/eventos')
    await act(async () => {})
    const link = container.querySelector('a[href="/portal/organizador/evento/novo"]')
    expect(link).toBeTruthy()
    cleanup()
  })
})
