import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import EditarEventoPage from './EditarEventoPage'
import { criarTokenFake } from '../../../test-utils'

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderPage(evento: Record<string, unknown> | null) {
  localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const mockFetch = vi.spyOn(globalThis, 'fetch')
  if (evento) {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => evento } as Response)
  } else {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Erro' }) } as Response)
  }
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/portal/organizador/evento/1/editar']}>
        <AuthProvider>
          <PortalProvider>
            <Routes>
              <Route path="/portal/organizador/evento/:id/editar" element={<EditarEventoPage />} />
            </Routes>
          </PortalProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() }, mockFetch }
}

const MOCK_RASCUNHO = {
  id: 1, titulo: 'Show', descricao: 'Descricao original', posterUrl: null,
  telefoneSuporte: null, emailSuporte: null, status: 'RASCUNHO',
  criadoEm: '2026-08-18T10:00:00Z',
  endereco: { rua: 'Rua A', numero: 123, bairro: 'Centro', cidade: 'SP', estado: 'SP', cep: '01000000' },
  categorias: [{ nome: 'INTEIRA', precoCentavos: 5000, requerComprovante: false }],
  sessoes: [],
}

const MOCK_COM_SESSOES = {
  id: 1, titulo: 'Show', descricao: 'Desc', posterUrl: null,
  telefoneSuporte: null, emailSuporte: null, status: 'PUBLICADO',
  criadoEm: '2026-08-18T10:00:00Z', endereco: null, categorias: [],
  sessoes: [{ id: 1, dataHora: '2026-09-01T20:00:00Z', status: 'ATIVA' }],
}

describe('EditarEventoPage interactions', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('shows loading state', () => {
    const { container, cleanup } = renderPage(new Promise(() => {}) as never)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('renders full form for draft event', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    expect(container.textContent).toContain('Salvar Altera')
    expect(container.querySelector('input[placeholder*="tulo"]')).toBeTruthy()
    expect(container.querySelector('textarea')).toBeTruthy()
    expect(container.textContent).toContain('Endere')
    expect(container.textContent).toContain('Categorias')
    cleanup()
  })

  it('shows restricted mode when event has sessoes', async () => {
    const { container, cleanup } = renderPage(MOCK_COM_SESSOES)
    await act(async () => {})
    expect(container.textContent).toContain('Somente a descri')
    expect(container.querySelector('input[placeholder*="tulo"]')).toBeFalsy()
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    const { container, cleanup } = renderPage(null)
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    cleanup()
  })

  it('shows only error when error and no title loaded', async () => {
    const { container, cleanup } = renderPage(null)
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    expect(container.querySelector('form')).toBeFalsy()
    cleanup()
  })

  it('submits form and navigates', async () => {
    const { container, cleanup, mockFetch } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Salvar'))
    await act(async () => { submitBtn?.click() })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/eventos/1'),
      expect.objectContaining({ method: 'PATCH' }),
    )
    cleanup()
  })

  it('handles submission error', async () => {
    const { container, cleanup, mockFetch } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    mockFetch.mockRejectedValueOnce(new Error('Erro ao salvar'))
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Salvar'))
    await act(async () => { submitBtn?.click() })
    expect(container.textContent).toContain('Erro ao salvar')
    cleanup()
  })

  it('handles non-Error submission failure', async () => {
    const { container, cleanup, mockFetch } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    mockFetch.mockRejectedValueOnce('string error')
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Salvar'))
    await act(async () => { submitBtn?.click() })
    expect(container.textContent).toContain('Erro desconhecido')
    cleanup()
  })

  it('submits only description for event with sessoes', async () => {
    const { container, cleanup, mockFetch } = renderPage(MOCK_COM_SESSOES)
    await act(async () => {})
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Salvar'))
    await act(async () => { submitBtn?.click() })
    const body = JSON.parse(mockFetch.mock.calls[1]![1]!.body as string)
    expect(body.descricao).toBe('Desc')
    expect(body.titulo).toBeUndefined()
    cleanup()
  })

  it('adds and removes categories', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Adicionar categoria'))
    await act(async () => { addBtn?.click() })
    expect(container.querySelectorAll('select').length).toBeGreaterThanOrEqual(2)
    const removeBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Remover')
    await act(async () => { removeBtn?.click() })
    cleanup()
  })

  it('toggles comprovante checkbox', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    await act(async () => { checkbox.click() })
    expect(checkbox.checked).toBe(true)
    cleanup()
  })

  it('loads event with address', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    expect(container.querySelector('input[placeholder="CEP"]')).toBeTruthy()
    expect(container.querySelector('input[placeholder="Rua"]')).toBeTruthy()
    cleanup()
  })

  it('loads event with address values populated', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const cepInput = container.querySelector('input[placeholder="CEP"]') as HTMLInputElement
    expect(cepInput?.value).toBe('01000000')
    cleanup()
  })

  it('submits form with address data', async () => {
    const { container, cleanup, mockFetch } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Salvar'))
    await act(async () => { submitBtn?.click() })
    const call = mockFetch.mock.calls[1]!
    const body = JSON.parse(call[1]!.body as string)
    expect(body.endereco).toBeDefined()
    expect(body.categorias).toBeDefined()
    cleanup()
  })

  it('updates address fields', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    const cepInput = container.querySelector('input[placeholder="CEP"]') as HTMLInputElement
    act(() => { setter.call(cepInput, '02000000'); cepInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const numInput = container.querySelector('input[placeholder="Número"]') as HTMLInputElement
    act(() => { setter.call(numInput, '456'); numInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const bairroInput = container.querySelector('input[placeholder="Bairro"]') as HTMLInputElement
    act(() => { setter.call(bairroInput, 'Vila'); bairroInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const cidadeInput = container.querySelector('input[placeholder="Cidade"]') as HTMLInputElement
    act(() => { setter.call(cidadeInput, 'Rio'); cidadeInput.dispatchEvent(new Event('input', { bubbles: true })) })
    cleanup()
  })

  it('changes UF select', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const ufSelect = container.querySelector('select') as HTMLSelectElement
    act(() => {
      ufSelect.value = 'RJ'
      ufSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    cleanup()
  })

  it('changes category type', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const catSelect = container.querySelector('select') as HTMLSelectElement
    act(() => {
      catSelect.value = 'MEIA'
      catSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    cleanup()
  })

  it('updates category price', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const priceInput = container.querySelector('input[type="number"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(priceInput, '30'); priceInput.dispatchEvent(new Event('input', { bubbles: true })) })
    expect(priceInput.value).toBe('30')
    cleanup()
  })

  it('sets empty price to 0', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const priceInput = container.querySelector('input[type="number"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(priceInput, '10'); priceInput.dispatchEvent(new Event('input', { bubbles: true })) })
    act(() => { setter.call(priceInput, ''); priceInput.dispatchEvent(new Event('input', { bubbles: true })) })
    cleanup()
  })

  it('updates poster, phone, email fields', async () => {
    const { container, cleanup } = renderPage(MOCK_RASCUNHO)
    await act(async () => {})
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    const posterInput = container.querySelector('input[placeholder*="poster"]') as HTMLInputElement
    act(() => { setter.call(posterInput, 'https://img.test/p.jpg'); posterInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const phoneInput = container.querySelector('input[placeholder*="Telefone"]') as HTMLInputElement
    act(() => { setter.call(phoneInput, '1199999'); phoneInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const emailInput = container.querySelector('input[placeholder*="Email"]') as HTMLInputElement
    act(() => { setter.call(emailInput, 'suporte@test.com'); emailInput.dispatchEvent(new Event('input', { bubbles: true })) })
    cleanup()
  })

  it('submits with empty address (no endereco in body)', async () => {
    const eventoSemEndereco = { ...MOCK_RASCUNHO, endereco: null }
    const { container, cleanup, mockFetch } = renderPage(eventoSemEndereco)
    await act(async () => {})
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Salvar'))
    await act(async () => { submitBtn?.click() })
    const call = mockFetch.mock.calls[1]!
    const body = JSON.parse(call[1]!.body as string)
    expect(body.endereco).toBeUndefined()
    cleanup()
  })
})
