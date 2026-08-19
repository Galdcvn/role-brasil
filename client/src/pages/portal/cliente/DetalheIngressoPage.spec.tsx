import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import DetalheIngressoPage from './DetalheIngressoPage'
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
            <DetalheIngressoPage />
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

function ok(data: unknown) {
  return { data, ok: true }
}

function mockFetchSequence(responses: Array<{ data: unknown; ok?: boolean }>) {
  const spy = vi.spyOn(globalThis, 'fetch')
  for (const r of responses) {
    spy.mockResolvedValueOnce({ ok: r.ok ?? true, json: async () => r.data } as Response)
  }
  return spy
}

const ingressoFake = {
  id: 1,
  codigo: 'RB-001',
  status: 'EMITIDO',
  categoria: 'INTEIRA',
  criadoEm: '2026-08-18T12:00:00Z',
  assento: { fileira: 'A', numero: 1 },
  reserva: {
    id: 1,
    sessao: {
      id: 10,
      dataHora: '2026-09-01T20:00:00Z',
      evento: {
        id: 1,
        titulo: 'Show Rock',
        posterUrl: 'https://img.test/poster.jpg',
        endereco: { cidade: 'São Paulo', estado: 'SP' },
      },
    },
    itens: [{ categoria: 'INTEIRA', precoCentavos: 8000 }],
  },
}

describe('DetalheIngressoPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', () => {
    mockFetch(new Promise(() => {}))
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('renders ticket details', async () => {
    mockFetch(ingressoFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    expect(container.textContent).toContain('RB-001')
    expect(container.textContent).toContain('INTEIRA')
    expect(container.textContent).toContain('R$ 80,00')
    expect(container.textContent).toContain('São Paulo/SP')
    expect(container.textContent).toContain('A1')
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    mockFetch({ message: 'Erro ao carregar' }, false)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    expect(container.textContent).toContain('Erro ao carregar')
    cleanup()
  })

  it('shows QR code', async () => {
    mockFetch(ingressoFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    const qrImg = container.querySelector('img[alt*="QR Code"]') as HTMLImageElement
    expect(qrImg).toBeTruthy()
    expect(qrImg.src).toContain('api.qrserver.com')
    cleanup()
  })

  it('shows cancel button for EMITIDO ticket', async () => {
    mockFetch(ingressoFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Cancelar Ingresso',
    )
    expect(cancelBtn).toBeTruthy()
    cleanup()
  })

  it('shows cancel button for PENDENTE ticket', async () => {
    mockFetch({ ...ingressoFake, status: 'PENDENTE' })
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Cancelar Ingresso',
    )
    expect(cancelBtn).toBeTruthy()
    cleanup()
  })

  it('does not show cancel button for USADO ticket', async () => {
    mockFetch({ ...ingressoFake, status: 'USADO' })
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Cancelar Ingresso',
    )
    expect(cancelBtn).toBeFalsy()
    cleanup()
  })

  it('confirms cancellation before executing', async () => {
    mockFetch(ingressoFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})

    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Cancelar Ingresso',
    ) as HTMLButtonElement
    act(() => cancelBtn.click())

    expect(container.textContent).toContain('Confirme o cancelamento')
    expect(container.textContent).toContain('Confirmar Cancelamento')
    cleanup()
  })

  it('executes cancellation after confirmation', async () => {
    mockFetchSequence([ok(ingressoFake), ok({})])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})

    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Cancelar Ingresso',
    ) as HTMLButtonElement
    await act(async () => { cancelBtn.click() })

    const confirmBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Confirmar Cancelamento',
    ) as HTMLButtonElement
    await act(async () => { confirmBtn.click() })

    expect(container.textContent).toContain('CANCELADO')
    cleanup()
  })

  it('shows cancellation error', async () => {
    mockFetchSequence([ok(ingressoFake), { data: { message: 'Erro ao cancelar' }, ok: false }])
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})

    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Cancelar Ingresso',
    ) as HTMLButtonElement
    await act(async () => { cancelBtn.click() })

    const confirmBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent === 'Confirmar Cancelamento',
    ) as HTMLButtonElement
    await act(async () => { confirmBtn.click() })

    expect(container.textContent).toContain('Erro ao cancelar')
    cleanup()
  })

  it('renders ticket without poster', async () => {
    mockFetch({
      ...ingressoFake,
      reserva: {
        ...ingressoFake.reserva,
        sessao: { ...ingressoFake.reserva.sessao, evento: { ...ingressoFake.reserva.sessao.evento, posterUrl: null } },
      },
    })
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    cleanup()
  })

  it('renders ticket without assento', async () => {
    mockFetch({ ...ingressoFake, assento: null })
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    expect(container.textContent).not.toContain('Assento')
    cleanup()
  })

  it('renders ticket without endereco', async () => {
    mockFetch({
      ...ingressoFake,
      reserva: {
        ...ingressoFake.reserva,
        sessao: {
          ...ingressoFake.reserva.sessao,
          evento: { ...ingressoFake.reserva.sessao.evento, endereco: null },
        },
      },
    })
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Rock')
    cleanup()
  })

  it('has back button', async () => {
    mockFetch(ingressoFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    const backBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Voltar'),
    )
    expect(backBtn).toBeTruthy()
    cleanup()
  })

  it('shows cancel confirmation text before first click', async () => {
    mockFetch(ingressoFake)
    const { container, cleanup } = renderPage('/portal/cliente/ingressos/1')
    await act(async () => {})
    expect(container.textContent).toContain('Tem certeza que deseja cancelar este ingresso?')
    cleanup()
  })
})
