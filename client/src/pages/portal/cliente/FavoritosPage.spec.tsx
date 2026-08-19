import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import FavoritosPage from './FavoritosPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage(entry = '/portal/cliente/favoritos') {
  localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <AuthProvider>
          <PortalProvider>
            <FavoritosPage />
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

const eventoFavorito = {
  id: 1,
  titulo: 'Rock Festival',
  posterUrl: 'https://img.com/poster.jpg',
  status: 'PUBLICADO',
  categorias: [{ nome: 'Pista', precoCentavos: 5000 }],
  endereco: { cidade: 'São Paulo', estado: 'SP' },
  proximaSessao: { dataHora: '2026-09-01T20:00:00Z', vagasDisponiveis: 50 },
}

describe('FavoritosPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders loading skeleton', () => {
    mockFetch(new Promise(() => {}))
    const { container, cleanup } = renderPage()
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(container.textContent).toContain('Meus Favoritos')
    cleanup()
  })

  it('shows error message on fetch failure', async () => {
    mockFetch({ message: 'fail' }, false)
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('fail')
    cleanup()
  })

  it('shows empty state when no favorites', async () => {
    mockFetch([])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Nenhum favorito')
    cleanup()
  })

  it('renders favorited event cards', async () => {
    mockFetch([eventoFavorito])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock Festival')
    expect(container.textContent).toContain('São Paulo/SP')
    expect(container.textContent).toContain('Pista')
    expect(container.textContent).toContain('R$ 50,00')
    cleanup()
  })

  it('renders event without poster', async () => {
    mockFetch([{ ...eventoFavorito, posterUrl: null }])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock Festival')
    expect(container.querySelector('.bg-slate-800')).not.toBeNull()
    cleanup()
  })

  it('renders event without endereco', async () => {
    mockFetch([{ ...eventoFavorito, endereco: null }])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock Festival')
    expect(container.textContent).not.toContain('São Paulo')
    cleanup()
  })

  it('renders event without proximaSessao', async () => {
    mockFetch([{ ...eventoFavorito, proximaSessao: null }])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock Festival')
    expect(container.textContent).not.toContain('Próxima')
    cleanup()
  })

  it('renders event with empty categorias', async () => {
    mockFetch([{ ...eventoFavorito, categorias: [] }])
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Rock Festival')
    cleanup()
  })

  it('handles non-Error thrown', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('string error')
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    cleanup()
  })
})
