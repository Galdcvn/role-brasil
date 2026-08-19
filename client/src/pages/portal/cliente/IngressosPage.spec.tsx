import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import IngressosPage from './IngressosPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage(entry: string) {
  localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <AuthProvider>
          <PortalProvider>
            <IngressosPage />
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

const ingressosFake = [
  {
    id: 1,
    codigo: 'RB-001',
    status: 'EMITIDO',
    criadoEm: '2026-08-18T12:00:00Z',
    sessao: {
      dataHora: '2026-09-01T20:00:00Z',
      evento: { id: 10, titulo: 'Show Rock', posterUrl: null },
      assento: { fileira: 'A', numero: 1 },
    },
    reserva: { itens: [{ categoria: 'INTEIRA' }] },
  },
  {
    id: 2,
    codigo: 'RB-002',
    status: 'PENDENTE',
    criadoEm: '2026-08-18T12:00:00Z',
    sessao: {
      dataHora: '2026-09-02T20:00:00Z',
      evento: { id: 11, titulo: 'Festa', posterUrl: 'https://img.test/poster.jpg' },
      assento: null,
    },
    reserva: { itens: [{ categoria: 'MEIA' }] },
  },
]

describe('IngressosPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', async () => {
    mockFetch(new Promise(() => {}))
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('shows empty state when no tickets', async () => {
    mockFetch([])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('Nenhum ingresso encontrado')
    expect(container.textContent).toContain('Compre ingressos em eventos')
    cleanup()
  })

  it('renders ticket list', async () => {
    mockFetch(ingressosFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    expect(container.textContent).toContain('Festa')
    cleanup()
  })

  it('shows filter buttons with counts', async () => {
    mockFetch(ingressosFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('Todos (2)')
    expect(container.textContent).toContain('Emitidos (1)')
    expect(container.textContent).toContain('Pendentes (1)')
    cleanup()
  })

  it('filters by EMITIDO status', async () => {
    mockFetch(ingressosFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})

    const emitidoBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitidos'),
    ) as HTMLButtonElement
    act(() => emitidoBtn.click())

    expect(container.textContent).toContain('Show Rock')
    expect(container.textContent).not.toContain('Festa')
    cleanup()
  })

  it('filters by PENDENTE status', async () => {
    mockFetch(ingressosFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})

    const pendenteBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Pendentes'),
    ) as HTMLButtonElement
    act(() => pendenteBtn.click())

    expect(container.textContent).not.toContain('Show Rock')
    expect(container.textContent).toContain('Festa')
    cleanup()
  })

  it('clears filter when no results match', async () => {
    mockFetch([{ ...ingressosFake[0], status: 'EMITIDO' }])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})

    const pendenteBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Pendentes'),
    ) as HTMLButtonElement
    act(() => pendenteBtn.click())

    expect(container.textContent).toContain('Nenhum ingresso nesta categoria')
    const clearBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Limpar Filtro',
    ) as HTMLButtonElement
    expect(clearBtn).toBeTruthy()
    act(() => clearBtn.click())
    expect(container.textContent).toContain('Show Rock')
    cleanup()
  })

  it('renders ticket with poster', async () => {
    mockFetch([ingressosFake[1]])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.querySelector('img[src="https://img.test/poster.jpg"]')).toBeTruthy()
    cleanup()
  })

  it('renders ticket without poster', async () => {
    mockFetch([ingressosFake[0]])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    cleanup()
  })

  it('links to ticket detail', async () => {
    mockFetch(ingressosFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    const link = container.querySelector('a[href="/portal/cliente/ingressos/1"]')
    expect(link).toBeTruthy()
    cleanup()
  })

  it('shows seat info when available', async () => {
    mockFetch([ingressosFake[0]])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('A1')
    cleanup()
  })

  it('shows category info', async () => {
    mockFetch([ingressosFake[1]])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('MEIA')
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    mockFetch({ message: 'Erro de rede' }, false)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    expect(container.textContent).toContain('Erro de rede')
    cleanup()
  })

  it('shows Explorar Eventos CTA on empty state', async () => {
    mockFetch([])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})
    const ctaBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Explorar Eventos',
    )
    expect(ctaBtn).toBeTruthy()
    cleanup()
  })

  it('filters with all selected', async () => {
    mockFetch(ingressosFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos')
    await act(async () => {})

    const todosBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Todos'),
    ) as HTMLButtonElement
    act(() => todosBtn.click())

    expect(container.textContent).toContain('Show Rock')
    expect(container.textContent).toContain('Festa')
    cleanup()
  })
})
