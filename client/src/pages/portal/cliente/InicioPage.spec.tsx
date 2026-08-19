import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import InicioPage from './InicioPage'
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
            <InicioPage />
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

function setReactInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  nativeSetter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const eventoFake = {
  id: 1,
  titulo: 'Show MPB',
  posterUrl: 'https://img.test/poster.jpg',
  criadoEm: '2026-08-18T20:00:00Z',
  endereco: { cidade: 'São Paulo', estado: 'SP' },
  categorias: [{ nome: 'Pista', precoCentavos: 5000 }],
  sessoes: [{ id: 10, dataHora: '2026-09-01T20:00:00Z', vagasDisponiveis: 50 }],
}

describe('InicioPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', () => {
    mockFetch(new Promise(() => {}))
    const { container, cleanup } = renderPage('/portal/cliente')
    expect(container.textContent).toContain('Explorar Eventos')
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('shows empty state when no events', async () => {
    mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Nenhum evento encontrado')
    cleanup()
  })

  it('renders event list', async () => {
    mockFetch({ eventos: [eventoFake], total: 1, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Show MPB')
    expect(container.textContent).toContain('São Paulo/SP')
    expect(container.textContent).toContain('R$ 50,00')
    expect(container.querySelector('img[src="https://img.test/poster.jpg"]')).toBeTruthy()
    cleanup()
  })

  it('renders event without poster', async () => {
    mockFetch({ eventos: [{ ...eventoFake, posterUrl: null }], total: 1, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Show MPB')
    expect(container.querySelector('img[src="https://img.test/poster.jpg"]')).toBeFalsy()
    cleanup()
  })

  it('links to event detail', async () => {
    mockFetch({ eventos: [eventoFake], total: 1, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    const link = container.querySelector('a[href="/portal/cliente/evento/1"]')
    expect(link).toBeTruthy()
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    mockFetch({ message: 'Erro de rede' }, false)
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Erro de rede')
    cleanup()
  })

  it('toggles filters panel', async () => {
    mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const filterBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Filtros'),
    ) as HTMLButtonElement
    expect(filterBtn).toBeTruthy()
    expect(container.textContent).not.toContain('Cidade')

    act(() => filterBtn.click())
    expect(container.textContent).toContain('Cidade')

    act(() => filterBtn.click())
    cleanup()
  })

  it('submits search form', async () => {
    const spy = mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const input = container.querySelector('input[placeholder="Buscar eventos..."]') as HTMLInputElement
    setReactInputValue(input, 'rock')

    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })

    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]
    expect(String(lastCall?.[0])).toContain('busca=rock')
    cleanup()
  })

  it('applies filters', async () => {
    const spy = mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const filterBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Filtros'),
    ) as HTMLButtonElement
    act(() => filterBtn.click())

    const cidadeInput = container.querySelector('input[placeholder="São Paulo"]') as HTMLInputElement
    setReactInputValue(cidadeInput, 'Rio')

    const applyBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Aplicar',
    ) as HTMLButtonElement
    await act(async () => { applyBtn.click() })

    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]
    expect(String(lastCall?.[0])).toContain('cidade=Rio')
    cleanup()
  })

  it('clears filters', async () => {
    mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const filterBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Filtros'),
    ) as HTMLButtonElement
    act(() => filterBtn.click())

    const clearBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Limpar',
    ) as HTMLButtonElement
    expect(clearBtn).toBeTruthy()
    act(() => clearBtn.click())
    cleanup()
  })

  it('navigates pagination', async () => {
    mockFetch({ eventos: [eventoFake], total: 24, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    expect(container.textContent).toContain('1 / 2')

    const nextBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Próxima',
    ) as HTMLButtonElement
    expect(nextBtn).toBeTruthy()
    expect(nextBtn.disabled).toBe(false)

    const prevBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Anterior',
    ) as HTMLButtonElement
    expect(prevBtn.disabled).toBe(true)

    cleanup()
  })

  it('displays event without sessions', async () => {
    mockFetch({ eventos: [{ ...eventoFake, sessoes: [], categorias: [] }], total: 1, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Sem sessões')
    cleanup()
  })

  it('displays event without endereco', async () => {
    mockFetch({ eventos: [{ ...eventoFake, endereco: null }], total: 1, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Show MPB')
    cleanup()
  })

  it('shows active filters badge when filters are set', async () => {
    const spy = mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const filterBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Filtros'),
    ) as HTMLButtonElement
    act(() => filterBtn.click())

    const cidadeInput = container.querySelector('input[placeholder="São Paulo"]') as HTMLInputElement
    setReactInputValue(cidadeInput, 'Rio')

    const applyBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Aplicar',
    ) as HTMLButtonElement
    await act(async () => { applyBtn.click() })

    spy.mockClear()
    await act(async () => {})

    expect(container.textContent).toContain('Ativos')
    cleanup()
  })

  it('shows filter options with state select', async () => {
    mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const filterBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Filtros'),
    ) as HTMLButtonElement
    act(() => filterBtn.click())

    expect(container.textContent).toContain('Estado')
    expect(container.textContent).toContain('Data início')
    expect(container.textContent).toContain('Data fim')
    expect(container.textContent).toContain('Preço mín')
    expect(container.textContent).toContain('Preço máx')
    cleanup()
  })

  it('handles filter with "no results" message', async () => {
    const spy = mockFetch({ eventos: [], total: 0, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})

    const filterBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Filtros'),
    ) as HTMLButtonElement
    act(() => filterBtn.click())

    const cidadeInput = container.querySelector('input[placeholder="São Paulo"]') as HTMLInputElement
    setReactInputValue(cidadeInput, 'CidadeFantasma')

    const applyBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Aplicar',
    ) as HTMLButtonElement
    await act(async () => { applyBtn.click() })

    spy.mockClear()
    await act(async () => {})

    expect(container.textContent).toContain('Tente ajustar os filtros')
    cleanup()
  })

  it('handles multiple categories on event card', async () => {
    mockFetch({
      eventos: [{
        ...eventoFake,
        categorias: [
          { nome: 'Pista', precoCentavos: 5000 },
          { nome: 'VIP', precoCentavos: 15000 },
          { nome: 'Camarote', precoCentavos: 25000 },
        ],
      }],
      total: 1, page: 1, limit: 12,
    })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Pista')
    expect(container.textContent).toContain('R$ 50,00')
    expect(container.textContent).toContain('VIP')
    cleanup()
  })

  it('displays formatted next session date', async () => {
    mockFetch({ eventos: [eventoFake], total: 1, page: 1, limit: 12 })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('Próxima:')
    cleanup()
  })

  it('renders event with more than 3 categories shows only first 3', async () => {
    mockFetch({
      eventos: [{
        ...eventoFake,
        categorias: [
          { nome: 'A', precoCentavos: 100 },
          { nome: 'B', precoCentavos: 200 },
          { nome: 'C', precoCentavos: 300 },
          { nome: 'D', precoCentavos: 400 },
        ],
      }],
      total: 1, page: 1, limit: 12,
    })
    const { container, cleanup } = renderPage('/portal/cliente')
    await act(async () => {})
    expect(container.textContent).toContain('A')
    expect(container.textContent).toContain('B')
    expect(container.textContent).toContain('C')
    expect(container.textContent).not.toContain('D')
    cleanup()
  })
})
