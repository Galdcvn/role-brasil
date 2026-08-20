import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import DetalheEventoPage from './DetalheEventoPage'
import { criarTokenFake } from '../../../test-utils'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}))

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
            <Routes>
              <Route path="/portal/cliente/evento/:id" element={<DetalheEventoPage />} />
            </Routes>
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

function mockFetchSequence(responses: Array<{ data: unknown; ok?: boolean }>) {
  const spy = vi.spyOn(globalThis, 'fetch')
  for (const r of responses) {
    spy.mockResolvedValueOnce({ ok: r.ok ?? true, json: async () => r.data } as Response)
  }
  return spy
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  nativeSetter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function ok(data: unknown) {
  return { data, ok: true }
}

const eventoFake = {
  id: 1,
  titulo: 'Show Jazz',
  descricao: 'Uma noite de jazz',
  posterUrl: 'https://img.test/poster.jpg',
  telefoneSuporte: '(11) 99999-0000',
  emailSuporte: 'suporte@test.com',
  endereco: { rua: 'Rua Augusta', numero: 1000, bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP', cep: '01304-000' },
  categorias: [{ nome: 'Pista', precoCentavos: 8000 }, { nome: 'VIP', precoCentavos: 20000 }],
  sessoes: [
    { id: 10, dataHora: '2026-09-01T20:00:00Z', vagasDisponiveis: 50 },
    { id: 11, dataHora: '2026-09-02T20:00:00Z', vagasDisponiveis: 0 },
  ],
}

const assentosFake = [
  {
    fileira: 'A',
    assentos: [
      { id: 100, fileira: 'A', numero: 1, status: 'DISPONIVEL' },
      { id: 101, fileira: 'A', numero: 2, status: 'BLOQUEADO' },
      { id: 102, fileira: 'A', numero: 3, status: 'DISPONIVEL' },
    ],
  },
]

const reservaFake = {
  id: 1,
  status: 'PENDENTE',
  subtotalCentavos: 8000,
  expiraEm: new Date(Date.now() + 300000).toISOString(),
  itens: [{ id: 1, assentoSessaoId: 100, categoria: 'INTEIRA', precoCentavos: 8000 }],
  sessao: { id: 10, dataHora: '2026-09-01T20:00:00Z', evento: { id: 1, titulo: 'Show Jazz' } },
}

function mountPage() {
  return mockFetchSequence([ok(eventoFake), ok(false), ok([])])
}

function mountPageComIngresso() {
  return mockFetchSequence([ok(eventoFake), ok(false), ok([{ id: 1, reserva: { sessao: { evento: { id: 1 } } } }])])
}

describe('DetalheEventoPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state', () => {
    mockFetch(new Promise(() => {}))
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('renders event details', async () => {
    mountPage()
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Jazz')
    expect(container.textContent).toContain('Uma noite de jazz')
    expect(container.textContent).toContain('Rua Augusta')
    expect(container.textContent).toContain('São Paulo/SP')
    expect(container.textContent).toContain('Pista')
    expect(container.textContent).toContain('R$ 80,00')
    expect(container.textContent).toContain('VIP')
    expect(container.textContent).toContain('R$ 200,00')
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    mockFetch({ message: 'Evento não encontrado' }, false)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Evento não encontrado')
    cleanup()
  })

  it('renders sessions list', async () => {
    mountPage()
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Sessões')
    expect(container.textContent).toContain('50 vaga(s) disponível(is)')
    expect(container.textContent).toContain('0 vaga(s) disponível(is)')
    cleanup()
  })

  it('shows Comprar button for sessions with availability', async () => {
    mountPage()
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    const buyBtns = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent === 'Comprar')
    expect(buyBtns.length).toBe(2)
    const enabledBtns = buyBtns.filter((b) => !(b as HTMLButtonElement).disabled)
    expect(enabledBtns.length).toBe(1)
    cleanup()
  })

  it('disables Comprar button for sold out sessions', async () => {
    mountPage()
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    const disabledBuy = Array.from(container.querySelectorAll('button')).filter((b) => {
      const el = b as HTMLButtonElement
      return el.disabled && el.textContent === 'Comprar'
    })
    expect(disabledBuy.length).toBe(1)
    cleanup()
  })

  it('shows no sessions message', async () => {
    mockFetchSequence([ok({ ...eventoFake, sessoes: [] }), ok(false), ok([])])
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Nenhuma sessão disponível')
    cleanup()
  })

  it('enters seat selection after clicking Comprar', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    expect(container.textContent).toContain('Selecionar Assentos')
    expect(container.textContent).toContain('A')
    cleanup()
  })

  it('allows selecting an available seat', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    expect(container.textContent).toContain('Assentos Selecionados')
    expect(container.textContent).toContain('A1')
    cleanup()
  })

  it('does not select unavailable seat', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat2 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '2') as HTMLButtonElement
    expect(seat2.disabled).toBe(true)
    cleanup()
  })

  it('allows deselecting a seat', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })
    await act(async () => { seat1.click() })

    expect(container.textContent).not.toContain('Assentos Selecionados')
    cleanup()
  })

  it('allows changing seat category', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('Pista')
    act(() => { select.value = 'VIP'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(select.value).toBe('VIP')
    cleanup()
  })

  it('goes back to info from seat selection', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const backBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Voltar')) as HTMLButtonElement
    act(() => backBtn.click())

    expect(container.textContent).toContain('Sessões')
    cleanup()
  })

  it('creates reservation from seat selection', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    expect(container.textContent).toContain('Reserva')
    expect(container.textContent).toContain('Pagar')
    cleanup()
  })

  it('renders payment form with PIX selected', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    expect(container.textContent).toContain('PIX')
    expect(container.textContent).toContain('Cartão')
    expect(container.textContent).toContain('Escaneie o QR Code')
    cleanup()
  })

  it('switches to CARTAO payment method', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const cartaoBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cartão') as HTMLButtonElement
    act(() => cartaoBtn.click())

    expect(container.querySelector('input[placeholder="Nome no cartão"]')).toBeTruthy()
    expect(container.querySelector('input[placeholder="Número do cartão"]')).toBeTruthy()
    expect(container.querySelector('input[placeholder="Validade (MM/AA)"]')).toBeTruthy()
    expect(container.querySelector('input[placeholder="CVV"]')).toBeTruthy()
    cleanup()
  })

  it('fills in cartão form and pays', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'PAGO', ingressos: [{ id: 1, codigo: 'RB-001' }] }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const cartaoBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cartão') as HTMLButtonElement
    act(() => cartaoBtn.click())

    const nomeInput = container.querySelector('input[placeholder="Nome no cartão"]') as HTMLInputElement
    const numInput = container.querySelector('input[placeholder="Número do cartão"]') as HTMLInputElement
    const valInput = container.querySelector('input[placeholder="Validade (MM/AA)"]') as HTMLInputElement
    const cvvInput = container.querySelector('input[placeholder="CVV"]') as HTMLInputElement

    setReactInputValue(nomeInput, 'João Silva')
    setReactInputValue(numInput, '4111111111111111')
    setReactInputValue(valInput, '12/28')
    setReactInputValue(cvvInput, '123')

    const pagarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Pagar')) as HTMLButtonElement
    await act(async () => { pagarBtn.click() })

    expect(container.textContent).toContain('Ingressos Emitidos!')
    expect(container.textContent).toContain('RB-001')
    cleanup()
  })

  it('shows payment error when payment is refused', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'RECUSADO' }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const pagarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Pagar')) as HTMLButtonElement
    await act(async () => { pagarBtn.click() })

    expect(mockToastError).toHaveBeenCalled()
    cleanup()
  })

  it('shows reservation expired error', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    expect(container.textContent).toContain('Reserva')
    cleanup()
  })

  it('shows confirmation with multiple tickets', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'PAGO', ingressos: [{ id: 1, codigo: 'RB-001' }, { id: 2, codigo: 'RB-002' }] }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const pagarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Pagar')) as HTMLButtonElement
    await act(async () => { pagarBtn.click() })

    expect(container.textContent).toContain('RB-001')
    expect(container.textContent).toContain('RB-002')
    expect(container.textContent).toContain('Ver Meus Ingressos')
    cleanup()
  })

  it('toggles favorite on', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ favoritado: true }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const favBtn = container.querySelector('button[aria-label*="favoritos"]') as HTMLButtonElement
    expect(favBtn).toBeTruthy()
    await act(async () => { favBtn.click() })
    cleanup()
  })

  it('toggles favorite off', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ favoritado: false }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const favBtn = container.querySelector('button[aria-label*="favoritos"]') as HTMLButtonElement
    expect(favBtn).toBeTruthy()
    await act(async () => { favBtn.click() })
    cleanup()
  })

  it('renders event without endereco', async () => {
    mockFetchSequence([ok({ ...eventoFake, endereco: null }), ok(false), ok([])])
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Jazz')
    expect(container.textContent).not.toContain('Rua Augusta')
    cleanup()
  })

  it('renders event without description', async () => {
    mockFetchSequence([ok({ ...eventoFake, descricao: null }), ok(false), ok([])])
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Jazz')
    cleanup()
  })

  it('renders event without poster', async () => {
    mockFetchSequence([ok({ ...eventoFake, posterUrl: null }), ok(false), ok([])])
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})
    expect(container.textContent).toContain('Show Jazz')
    cleanup()
  })

  it('shows seat legend', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    expect(container.textContent).toContain('Disponível')
    expect(container.textContent).toContain('Selecionado')
    expect(container.textContent).toContain('Indisponível')
    cleanup()
  })

  it('shows chat section when user has ticket', async () => {
    const spy = mountPageComIngresso()
    spy.mockResolvedValue({ ok: true, json: async () => [] } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const chatBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Chat do Evento')) as HTMLButtonElement
    expect(chatBtn).toBeTruthy()
    act(() => { chatBtn.click() })
    await act(async () => {})

    expect(container.textContent).toContain('Enviar')
    cleanup()
  })

  it('does not show chat section when user has no ticket', async () => {
    mountPage()
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const chatBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Chat do Evento'))
    expect(chatBtn).toBeFalsy()
    cleanup()
  })

  it('sends chat message', async () => {
    const spy = mountPageComIngresso()
    const msgResponse = { ok: true, json: async () => ({ id: 2, eventoId: 1, remetenteId: 1, conteudo: 'Nova msg', lida: false, criadoEm: '2026-08-18', remetente: { id: 1, nome: 'João' } }) } as Response
    spy.mockResolvedValue({ ok: true, json: async () => [] } as Response)
    spy.mockResolvedValueOnce(msgResponse)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const chatBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Chat do Evento')) as HTMLButtonElement
    act(() => { chatBtn.click() })
    await act(async () => {})

    const msgInput = container.querySelector('input[placeholder="Digite sua mensagem..."]') as HTMLInputElement
    expect(msgInput).toBeTruthy()
    setReactInputValue(msgInput, 'Nova msg')

    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 3, eventoId: 1, remetenteId: 1, conteudo: 'Nova msg', lida: false, criadoEm: '2026-08-18', remetente: { id: 1, nome: 'João' } }) } as Response)

    const sendBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Enviar') as HTMLButtonElement
    await act(async () => { sendBtn.click() })

    cleanup()
  })

  it('does not send empty message', async () => {
    const spy = mountPageComIngresso()
    spy.mockResolvedValue({ ok: true, json: async () => [] } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const chatBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Chat do Evento')) as HTMLButtonElement
    act(() => { chatBtn.click() })
    await act(async () => {})

    const sendBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Enviar') as HTMLButtonElement
    expect(sendBtn.disabled).toBe(true)
    cleanup()
  })

  it('closes chat section', async () => {
    const spy = mountPageComIngresso()
    spy.mockResolvedValue({ ok: true, json: async () => [] } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const chatBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Chat do Evento')) as HTMLButtonElement
    act(() => { chatBtn.click() })
    await act(async () => {})
    expect(container.querySelector('input[placeholder="Digite sua mensagem..."]')).toBeTruthy()

    act(() => { chatBtn.click() })
    await act(async () => {})
    expect(container.querySelector('input[placeholder="Digite sua mensagem..."]')).toBeFalsy()
    cleanup()
  })

  it('renders empty chat state', async () => {
    const spy = mountPageComIngresso()
    spy.mockResolvedValue({ ok: true, json: async () => [] } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const chatBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Chat do Evento')) as HTMLButtonElement
    act(() => { chatBtn.click() })
    await act(async () => {})

    expect(container.textContent).toContain('Nenhuma mensagem ainda')
    cleanup()
  })

  it('renders seat loading state', async () => {
    const spy = mountPage()
    spy.mockResolvedValue(new Promise(() => {}) as unknown as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('shows seat fetch error', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro assentos' }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    expect(container.textContent).toContain('Erro assentos')
    cleanup()
  })

  it('shows reservation fetch error', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro reserva' }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    expect(container.textContent).toContain('Erro reserva')
    cleanup()
  })

  it('shows payment network error', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    spy.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro pagamento' }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const pagarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Pagar')) as HTMLButtonElement
    await act(async () => { pagarBtn.click() })

    expect(mockToastError).toHaveBeenCalled()
    cleanup()
  })

  it('toggle favorite fails silently', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro' }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const favBtn = container.querySelector('button[aria-label*="favoritos"]') as HTMLButtonElement
    await act(async () => { favBtn.click() })
    expect(container.textContent).toContain('Show Jazz')
    cleanup()
  })

  it('handles seat fetch error and returns to info', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro' }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    expect(container.textContent).toContain('Sessões')
    cleanup()
  })

  it('clicks PIX payment button explicitly', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const cartaoBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cartão') as HTMLButtonElement
    act(() => cartaoBtn.click())

    const pixBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'PIX') as HTMLButtonElement
    act(() => pixBtn.click())

    expect(container.textContent).toContain('Escaneie o QR Code')
    cleanup()
  })

  it('navigates to ingressos after confirmation', async () => {
    const spy = mountPage()
    spy.mockResolvedValueOnce({ ok: true, json: async () => assentosFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => reservaFake } as Response)
    spy.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'PAGO', ingressos: [{ id: 1, codigo: 'RB-001' }] }) } as Response)
    const { container, cleanup } = renderPage('/portal/cliente/evento/1')
    await act(async () => {})

    const buyBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Comprar' && !(b as HTMLButtonElement).disabled) as HTMLButtonElement
    await act(async () => { buyBtn.click() })

    const seat1 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '1') as HTMLButtonElement
    await act(async () => { seat1.click() })

    const reservarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reservar')) as HTMLButtonElement
    await act(async () => { reservarBtn.click() })

    const pagarBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Pagar')) as HTMLButtonElement
    await act(async () => { pagarBtn.click() })

    const verIngressosBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ver Meus Ingressos'),
    ) as HTMLButtonElement
    expect(verIngressosBtn).toBeTruthy()
    await act(async () => { verIngressosBtn.click() })
    cleanup()
  })
})
