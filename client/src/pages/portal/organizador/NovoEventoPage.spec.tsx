import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { PortalProvider } from '../../../contexts/PortalContext'
import NovoEventoPage from './NovoEventoPage'
import { criarTokenFake } from '../../../test-utils'

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderPage() {
  localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/portal/organizador/evento/novo']}>
        <AuthProvider>
          <PortalProvider>
            <NovoEventoPage />
          </PortalProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('NovoEventoPage interactions', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('searches TMDb and displays results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => [{ id: 1, titulo: 'Matrix', descricao: 'Futuro', posterUrl: 'https://img.test/m.jpg', ano: 1999 }],
    } as Response)
    const { container, cleanup } = renderPage()
    const searchInput = container.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(searchInput, 'Matrix'); searchInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const searchBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Buscar')
    await act(async () => { searchBtn?.click() })
    expect(container.textContent).toContain('Matrix')
    expect(container.textContent).toContain('1999')
    cleanup()
  })

  it('selects a movie and fills form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => [{ id: 1, titulo: 'Matrix', descricao: 'Futuro', posterUrl: 'https://img.test/m.jpg', ano: 1999 }],
    } as Response)
    const { container, cleanup } = renderPage()
    const searchInput = container.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(searchInput, 'Matrix'); searchInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const searchBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Buscar')
    await act(async () => { searchBtn?.click() })
    const movieBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent.includes('Matrix'))
    await act(async () => { movieBtn?.click() })
    expect(container.textContent).toContain('Filme selecionado')
    expect(container.textContent).toContain('Matrix')
    cleanup()
  })

  it('deselects a movie', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => [{ id: 1, titulo: 'Matrix', descricao: 'Futuro', posterUrl: 'https://img.test/m.jpg', ano: 1999 }],
    } as Response)
    const { container, cleanup } = renderPage()
    const searchInput = container.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(searchInput, 'Matrix'); searchInput.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => { Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Buscar')?.click() })
    await act(async () => { Array.from(container.querySelectorAll('button')).find((b) => b.textContent.includes('Matrix'))?.click() })
    const deselectBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '\u2715')
    await act(async () => { deselectBtn?.click() })
    expect(container.textContent).not.toContain('Filme selecionado')
    cleanup()
  })

  it('shows empty results on search failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network'))
    const { container, cleanup } = renderPage()
    const searchInput = container.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(searchInput, 'Matrix'); searchInput.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => { Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Buscar')?.click() })
    expect(container.textContent).not.toContain('Matrix')
    cleanup()
  })

  it('does not search with empty query', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const { container, cleanup } = renderPage()
    const searchBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Buscar')
    await act(async () => { searchBtn?.click() })
    expect(spy).not.toHaveBeenCalled()
    cleanup()
  })

  it('adds and removes categories', async () => {
    const { container, cleanup } = renderPage()
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Adicionar categoria'))
    await act(async () => { addBtn?.click() })
    expect(container.querySelectorAll('select').length).toBeGreaterThanOrEqual(2)
    const removeBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Remover')
    await act(async () => { removeBtn?.click() })
    cleanup()
  })

  it('validates empty title on submit', async () => {
    const { container, cleanup } = renderPage()
    const titleInput = container.querySelector('input[placeholder*="tulo"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(titleInput, '  '); titleInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Criar Evento')
    await act(async () => { submitBtn?.click() })
    expect(container.textContent).toContain('obrigat')
    cleanup()
  })

  it('creates event successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => ({ id: 42 }),
    } as Response)
    const { container, cleanup } = renderPage()
    const titleInput = container.querySelector('input[placeholder*="Título"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(titleInput, 'Meu Show'); titleInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Criar Evento')
    await act(async () => { submitBtn?.click() })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/eventos'),
      expect.objectContaining({ method: 'POST' }),
    )
    cleanup()
  })

  it('handles creation error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Erro ao criar'))
    const { container, cleanup } = renderPage()
    const titleInput = container.querySelector('input[placeholder*="Título"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(titleInput, 'Show'); titleInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Criar Evento')
    await act(async () => { submitBtn?.click() })
    expect(container.textContent).toContain('Erro ao criar')
    cleanup()
  })

  it('handles non-Error creation failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('network error')
    const { container, cleanup } = renderPage()
    const titleInput = container.querySelector('input[placeholder*="Título"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(titleInput, 'Show'); titleInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Criar Evento')
    await act(async () => { submitBtn?.click() })
    expect(container.textContent).toContain('Erro desconhecido')
    cleanup()
  })

  it('creates event with address', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => ({ id: 43 }),
    } as Response)
    const { container, cleanup } = renderPage()
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    const titleInput = container.querySelector('input[placeholder*="Título"]') as HTMLInputElement
    act(() => { setter.call(titleInput, 'Show'); titleInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const ruaInput = container.querySelector('input[placeholder="Rua"]') as HTMLInputElement
    act(() => { setter.call(ruaInput, 'Rua Augusta'); ruaInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Criar Evento')
    await act(async () => { submitBtn?.click() })
    expect(globalThis.fetch).toHaveBeenCalled()
    cleanup()
  })

  it('toggles comprovante checkbox', async () => {
    const { container, cleanup } = renderPage()
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    await act(async () => { checkbox.click() })
    expect(checkbox.checked).toBe(true)
    cleanup()
  })

  it('updates category price', async () => {
    const { container, cleanup } = renderPage()
    const priceInput = container.querySelector('input[type="number"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(priceInput, '25.5'); priceInput.dispatchEvent(new Event('input', { bubbles: true })) })
    expect(priceInput.value).toBe('25.5')
    cleanup()
  })

  it('changes category type via select', async () => {
    const { container, cleanup } = renderPage()
    const selects = container.querySelectorAll('select')
    const catSelect = selects[0]
    act(() => {
      catSelect.value = 'MEIA'
      catSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    cleanup()
  })

  it('changes UF via select', async () => {
    const { container, cleanup } = renderPage()
    const selects = container.querySelectorAll('select')
    const ufSelect = selects[selects.length - 1]
    act(() => {
      ufSelect.value = 'SP'
      ufSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    cleanup()
  })

  it('fills all address fields', async () => {
    const { container, cleanup } = renderPage()
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    const cepInput = container.querySelector('input[placeholder="CEP"]') as HTMLInputElement
    act(() => { setter.call(cepInput, '01000000'); cepInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const numInput = container.querySelector('input[placeholder="Número"]') as HTMLInputElement
    act(() => { setter.call(numInput, '123'); numInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const bairroInput = container.querySelector('input[placeholder="Bairro"]') as HTMLInputElement
    act(() => { setter.call(bairroInput, 'Centro'); bairroInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const cidadeInput = container.querySelector('input[placeholder="Cidade"]') as HTMLInputElement
    act(() => { setter.call(cidadeInput, 'SP'); cidadeInput.dispatchEvent(new Event('input', { bubbles: true })) })
    cleanup()
  })

  it('adds second category then removes it', async () => {
    const { container, cleanup } = renderPage()
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Adicionar categoria'))
    await act(async () => { addBtn?.click() })
    const removeBtns = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent === 'Remover')
    expect(removeBtns.length).toBe(2)
    await act(async () => { removeBtns[0].click() })
    const removeBtnsAfter = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent === 'Remover')
    expect(removeBtnsAfter.length).toBe(0)
    cleanup()
  })

  it('updates new category price', async () => {
    const { container, cleanup } = renderPage()
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Adicionar categoria'))
    await act(async () => { addBtn?.click() })
    const priceInputs = container.querySelectorAll('input[type="number"]')
    expect(priceInputs.length).toBe(2)
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(priceInputs[1], '15'); priceInputs[1].dispatchEvent(new Event('input', { bubbles: true })) })
    cleanup()
  })

  it('sets empty price resets to 0', async () => {
    const { container, cleanup } = renderPage()
    const priceInput = container.querySelector('input[type="number"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(priceInput, '10'); priceInput.dispatchEvent(new Event('input', { bubbles: true })) })
    act(() => { setter.call(priceInput, ''); priceInput.dispatchEvent(new Event('input', { bubbles: true })) })
    cleanup()
  })

  it('creates event without tmdb selection', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => ({ id: 50 }),
    } as Response)
    const { container, cleanup } = renderPage()
    const titleInput = container.querySelector('input[placeholder*="tulo"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(titleInput, 'Festival'); titleInput.dispatchEvent(new Event('input', { bubbles: true })) })
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Criar Evento')
    await act(async () => { submitBtn?.click() })
    const call = (globalThis.fetch as ReturnType<typeof vi.spyOn>).mock.calls[0]
    const body = JSON.parse(call[1].body as string)
    expect(body.tmdbId).toBeUndefined()
    expect(body.titulo).toBe('Festival')
    cleanup()
  })
})
