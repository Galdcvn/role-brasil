import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import DetalheEventoPage from './DetalheEventoPage'
import { criarTokenFake } from '../../../test-utils'

function renderPage(entry = '/portal/organizador/evento/1') {
  localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  return { container, root, cleanup: () => { act(() => root.unmount()); container.remove() }, entry }
}

const MOCK_PUBLICADO = {
  id: 1, titulo: 'Show', descricao: 'Desc', posterUrl: null,
  telefoneSuporte: null, emailSuporte: null, status: 'PUBLICADO',
  criadoEm: '2026-08-18T10:00:00Z',
  endereco: { rua: 'Rua A', numero: 123, bairro: 'Centro', cidade: 'SP', estado: 'SP', cep: '01000000' },
  categorias: [{ nome: 'INTEIRA', precoCentavos: 5000, requerComprovante: false }],
  sessoes: [{ id: 1, dataHora: '2026-09-01T20:00:00Z', status: 'ATIVA' }],
  metricas: {
    reservasTotais: 10, valorArrecadado: 50000,
    reservasPorSessao: [{ sessaoId: 1, dataHora: '2026-09-01T20:00:00Z', total: 10 }],
    valorArrecadadoPorSessao: [{ sessaoId: 1, dataHora: '2026-09-01T20:00:00Z', total: 50000 }],
  },
}

const MOCK_RASCUNHO = {
  ...MOCK_PUBLICADO, status: 'RASCUNHO',
  metricas: { ...MOCK_PUBLICADO.metricas, reservasTotais: 0 },
  sessoes: [],
}

describe('DetalheEventoPage interactions', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('shows draft actions (publish + delete)', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => MOCK_RASCUNHO } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    expect(container.textContent).toContain('Publicar')
    expect(container.textContent).toContain('Excluir')
    expect(container.textContent).toContain('Nenhuma sess')
    cleanup()
  })

  it('publishes a draft event', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RASCUNHO } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_RASCUNHO, status: 'PUBLICADO' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_RASCUNHO, status: 'PUBLICADO' }) } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const pubBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Publicar')
    await act(async () => { pubBtn?.click() })
    expect(container.textContent).toContain('PUBLICADO')
    cleanup()
  })

  it('creates a new session', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RASCUNHO } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_RASCUNHO, sessoes: [{ id: 1, dataHora: '2026-09-01T20:00:00Z', status: 'ATIVA' }], metricas: { ...MOCK_RASCUNHO.metricas, reservasPorSessao: [], valorArrecadadoPorSessao: [] } }) } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const dateInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(dateInput, '2026-09-01T20:00'); dateInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Adicionar')
    await act(async () => { addBtn?.click() })
    expect(container.textContent).toContain('01/09/2026')
    cleanup()
  })

  it('cancels a session', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PUBLICADO } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_PUBLICADO, sessoes: [{ id: 1, dataHora: '2026-09-01T20:00:00Z', status: 'CANCELADA' }], metricas: { ...MOCK_PUBLICADO.metricas, reservasPorSessao: [], valorArrecadadoPorSessao: [] } }) } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cancelar' && !b.textContent.includes('Evento'))
    await act(async () => { cancelBtn?.click() })
    expect(container.textContent).toContain('CANCELADA')
    cleanup()
  })

  it('shows API error on failed action', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PUBLICADO } as Response)
      .mockRejectedValueOnce(new Error('Falha ao cancelar'))
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cancelar Evento')
    await act(async () => { cancelBtn?.click() })
    expect(container.textContent).toContain('Falha ao cancelar')
    cleanup()
  })

  it('shows session error on failed create', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RASCUNHO } as Response)
      .mockRejectedValueOnce(new Error('Sessao invalida'))
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const dateInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(dateInput, '2026-09-01T20:00'); dateInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Adicionar')
    await act(async () => { addBtn?.click() })
    expect(container.textContent).toContain('Sessao invalida')
    cleanup()
  })

  it('shows session error from non-Error on failed create', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RASCUNHO } as Response)
      .mockRejectedValueOnce('string error')
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const dateInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { nativeSetter.call(dateInput, '2026-09-01T20:00'); dateInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Adicionar')
    await act(async () => { addBtn?.click() })
    expect(container.textContent).toContain('Erro')
    cleanup()
  })

  it('does not create session if date is empty', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_RASCUNHO } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Adicionar')
    await act(async () => { addBtn?.click() })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('shows non-Error action failure', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PUBLICADO } as Response)
      .mockRejectedValueOnce('network error')
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cancelar Evento')
    await act(async () => { cancelBtn?.click() })
    expect(container.textContent).toContain('Erro desconhecido')
    cleanup()
  })

  it('shows non-Error session cancel failure', async () => {
    const { container, root, cleanup, entry } = renderPage()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_PUBLICADO } as Response)
      .mockRejectedValueOnce('network error')
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Cancelar' && !b.textContent.includes('Evento'))
    await act(async () => { cancelBtn?.click() })
    expect(container.textContent).toContain('Erro desconhecido')
    cleanup()
  })

  it('renders event without endereco', async () => {
    const { container, root, cleanup, entry } = renderPage()
    const mockSemEndereco = { ...MOCK_PUBLICADO, endereco: null }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => mockSemEndereco } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    expect(container.textContent).toContain('Show')
    expect(container.textContent).not.toContain('Endere')
    cleanup()
  })

  it('renders event without descricao', async () => {
    const { container, root, cleanup, entry } = renderPage()
    const mockSemDesc = { ...MOCK_PUBLICADO, descricao: null }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => mockSemDesc } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    expect(container.textContent).toContain('Show')
    expect(container.textContent).not.toContain('Descri')
    cleanup()
  })

  it('renders event with no metrica for session', async () => {
    const { container, root, cleanup, entry } = renderPage()
    const mockSemMetrica = {
      ...MOCK_PUBLICADO,
      sessoes: [{ id: 99, dataHora: '2026-09-01T20:00:00Z', status: 'ATIVA' }],
      metricas: { reservasTotais: 0, valorArrecadado: 0, reservasPorSessao: [], valorArrecadadoPorSessao: [] },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => mockSemMetrica } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    expect(container.textContent).toContain('0 reservas')
    cleanup()
  })

  it('renders event with non-ATIVA session (no cancel button)', async () => {
    const { container, root, cleanup, entry } = renderPage()
    const mockCancelada = {
      ...MOCK_PUBLICADO,
      sessoes: [{ id: 1, dataHora: '2026-09-01T20:00:00Z', status: 'CANCELADA' }],
      metricas: { ...MOCK_PUBLICADO.metricas, reservasPorSessao: [{ sessaoId: 1, dataHora: '2026-09-01T20:00:00Z', total: 0 }], valorArrecadadoPorSessao: [{ sessaoId: 1, dataHora: '2026-09-01T20:00:00Z', total: 0 }] },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => mockCancelada } as Response)
    await act(async () => { root.render(<MemoryRouter initialEntries={[entry]}><AuthProvider><PortalProvider><Routes><Route path="/portal/organizador/evento/:id" element={<DetalheEventoPage />} /></Routes></PortalProvider></AuthProvider></MemoryRouter>) })
    expect(container.textContent).toContain('CANCELADA')
    const cancelButtons = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent === 'Cancelar' && !b.textContent.includes('Evento'))
    expect(cancelButtons.length).toBe(0)
    cleanup()
  })
})
