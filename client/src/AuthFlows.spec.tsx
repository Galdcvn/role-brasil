import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderAt(initialEntries: string[]) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>,
    )
  })
  return {
    container,
    cleanup() {
      act(() => root.unmount())
      container.remove()
    },
  }
}

function fillForm(container: HTMLElement, values: string[]) {
  const inputs = container.querySelectorAll('input')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    values.forEach((val, i) => {
      if (inputs[i]) {
        setter.call(inputs[i], val)
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
  })
}

async function submitForm(container: HTMLElement) {
  const form = container.querySelector('form')!
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true }))
  })
}

describe('Login fluxo', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('calls login API and stores token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'test-token' }),
    } as Response)

    const { container, cleanup } = renderAt(['/login'])
    fillForm(container, ['a@b.com', '123456'])
    await submitForm(container)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' }),
    )
    cleanup()
  })

  it('shows error on failed login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Credenciais inválidas' }),
    } as Response)

    const { container, cleanup } = renderAt(['/login'])
    fillForm(container, ['a@b.com', '123456'])
    await submitForm(container)

    expect(container.textContent).toContain('Credenciais inválidas')
    cleanup()
  })

  it('shows error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const { container, cleanup } = renderAt(['/login'])
    fillForm(container, ['a@b.com', '123456'])
    await submitForm(container)

    expect(container.textContent).toContain('Erro de conexão')
    cleanup()
  })
})

describe('Registro fluxo', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows password mismatch error', async () => {
    const { container, cleanup } = renderAt(['/registro/organizador'])
    fillForm(container, ['João', 'a@b.com', '123456', '654321'])
    await submitForm(container)

    expect(container.textContent).toContain('As senhas não coincidem')
    cleanup()
  })

  it('calls registro API and shows OTP step', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, nome: 'João', email: 'a@b.com', verificado: false, codigo: 123456 }),
    } as Response)

    const { container, cleanup } = renderAt(['/registro/cliente'])
    fillForm(container, ['João', 'a@b.com', '123456', '123456'])
    await submitForm(container)

    expect(container.textContent).toContain('código de verificação')
    cleanup()
  })

  it('shows error on failed registration', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Não foi possível realizar o cadastro' }),
    } as Response)

    const { container, cleanup } = renderAt(['/registro/cliente'])
    fillForm(container, ['João', 'a@b.com', '123456', '123456'])
    await submitForm(container)

    expect(container.textContent).toContain('Não foi possível realizar o cadastro')
    cleanup()
  })

  it('shows network error on registration', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('fail'))

    const { container, cleanup } = renderAt(['/registro/cliente'])
    fillForm(container, ['João', 'a@b.com', '123456', '123456'])
    await submitForm(container)

    expect(container.textContent).toContain('Erro de conexão')
    cleanup()
  })

  it('completes OTP verification and navigates to login', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, nome: 'João', email: 'a@b.com', verificado: false, codigo: 123456 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mensagem: 'E-mail verificado com sucesso' }),
      } as Response)

    const { container, cleanup } = renderAt(['/registro/cliente'])
    fillForm(container, ['João', 'a@b.com', '123456', '123456'])
    await submitForm(container)
    await submitForm(container)

    expect(container.textContent).toContain('Entrar')
    cleanup()
  })

  it('shows error on failed OTP verification', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, nome: 'João', email: 'a@b.com', verificado: false, codigo: 123456 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Código inválido' }),
      } as Response)

    const { container, cleanup } = renderAt(['/registro/cliente'])
    fillForm(container, ['João', 'a@b.com', '123456', '123456'])
    await submitForm(container)
    await submitForm(container)

    expect(container.textContent).toContain('Código inválido ou expirado')
    cleanup()
  })

  it('shows network error on OTP verification', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, nome: 'João', email: 'a@b.com', verificado: false, codigo: 123456 }),
      } as Response)
      .mockRejectedValueOnce(new Error('fail'))

    const { container, cleanup } = renderAt(['/registro/cliente'])
    fillForm(container, ['João', 'a@b.com', '123456', '123456'])
    await submitForm(container)
    await submitForm(container)

    expect(container.textContent).toContain('Erro de conexão')
    cleanup()
  })
})
