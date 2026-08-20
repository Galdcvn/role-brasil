import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import MeuPerfilPage from './MeuPerfilPage'
import { criarTokenFake } from '../../test-utils'

const usuarioFake = {
  id: 1,
  nome: 'João Silva',
  email: 'joao@test.com',
  verificado: true,
  criadoEm: '2025-01-15T10:00:00Z',
  papeis: [{ papel: { nome: 'CLIENT' } }],
}

function mockFetchHandler(handler: (url: string, init?: RequestInit) => unknown) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    const data = handler(url, init as RequestInit)
    if (data instanceof Error) {
      return { ok: false, json: async () => ({ message: data.message }) } as Response
    }
    return { ok: true, json: async () => data } as Response
  })
}

function mockFetchSuccess(usuario = usuarioFake) {
  return mockFetchHandler((url, init) => {
    if (url.includes('/usuario/me') && init?.method === 'PATCH') {
      return { ok: true }
    }
    if (url.includes('/usuario/me/senha') && init?.method === 'PATCH') {
      return { ok: true }
    }
    return usuario
  })
}

function renderPage(entry = '/portal/perfil') {
  localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT'] }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <MeuPerfilPage />
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  nativeSetter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('MeuPerfilPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    const { container, cleanup } = renderPage()
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    cleanup()
  })

  it('renders user info after loading', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Meu Perfil')
    const nomeInput = container.querySelector('input[placeholder="Nome"]') as HTMLInputElement
    expect(nomeInput.value).toBe('João Silva')
    const emailInput = container.querySelector('input[placeholder="E-mail"]') as HTMLInputElement
    expect(emailInput.value).toBe('joao@test.com')
    expect(container.textContent).toContain('Cliente')
    cleanup()
  })

  it('displays formatted creation date', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Membro desde:')
    cleanup()
  })

  it('displays multiple roles', async () => {
    mockFetchSuccess({
      ...usuarioFake,
      papeis: [
        { papel: { nome: 'CLIENT' } },
        { papel: { nome: 'ORGANIZER' } },
      ],
    })
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Cliente')
    expect(container.textContent).toContain('Organizador')
    cleanup()
  })

  it('displays unknown role label as raw name', async () => {
    mockFetchSuccess({
      ...usuarioFake,
      papeis: [{ papel: { nome: 'ADMIN' } }],
    })
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('ADMIN')
    cleanup()
  })

  it('shows error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Erro de rede' }),
    } as Response)
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Erro de rede')
    cleanup()
  })

  it('shows generic error on non-Error rejection', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('string error')
    const { container, cleanup } = renderPage()
    await act(async () => {})
    expect(container.textContent).toContain('Erro')
    cleanup()
  })

  it('navigates back when Voltar is clicked', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})
    const voltarBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Voltar'),
    ) as HTMLButtonElement
    expect(voltarBtn).toBeTruthy()
    await act(async () => { voltarBtn.click() })
    cleanup()
  })

  it('validates empty name on profile save', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const nomeInput = container.querySelector('input[placeholder="Nome"]') as HTMLInputElement
    setReactInputValue(nomeInput, '')

    const salvarBtn = Array.from(container.querySelectorAll('button[type="submit"]'))[0] as HTMLButtonElement
    await act(async () => { salvarBtn.click() })

    expect(container.textContent).toContain('Nome é obrigatório')
    cleanup()
  })

  it('validates whitespace-only name on profile save', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const nomeInput = container.querySelector('input[placeholder="Nome"]') as HTMLInputElement
    setReactInputValue(nomeInput, '   ')

    const salvarBtn = Array.from(container.querySelectorAll('button[type="submit"]'))[0] as HTMLButtonElement
    await act(async () => { salvarBtn.click() })

    expect(container.textContent).toContain('Nome é obrigatório')
    cleanup()
  })

  it('saves profile successfully', async () => {
    const spy = mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const nomeInput = container.querySelector('input[placeholder="Nome"]') as HTMLInputElement
    setReactInputValue(nomeInput, 'João Atualizado')

    const salvarBtn = Array.from(container.querySelectorAll('button[type="submit"]'))[0] as HTMLButtonElement
    await act(async () => { salvarBtn.click() })

    expect(container.textContent).toContain('Perfil atualizado com sucesso')
    const patchCall = spy.mock.calls.find(
      (c) => String(c[0]).includes('/usuario/me') && (c[1] as RequestInit)?.method === 'PATCH',
    )
    expect(patchCall).toBeTruthy()
    cleanup()
  })

  it('shows error on profile save failure', async () => {
    mockFetchHandler((url, init) => {
      if (url.includes('/usuario/me') && init?.method === 'PATCH') {
        return new Error('Erro ao salvar')
      }
      return usuarioFake
    })
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const nomeInput = container.querySelector('input[placeholder="Nome"]') as HTMLInputElement
    setReactInputValue(nomeInput, 'Novo Nome')

    const salvarBtn = Array.from(container.querySelectorAll('button[type="submit"]'))[0] as HTMLButtonElement
    await act(async () => { salvarBtn.click() })

    expect(container.textContent).toContain('Erro ao salvar')
    cleanup()
  })

  it('shows generic error on profile save rejection', async () => {
    mockFetchHandler((url, init) => {
      if (url.includes('/usuario/me') && init?.method === 'PATCH') {
        throw 'string error'
      }
      return usuarioFake
    })
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const nomeInput = container.querySelector('input[placeholder="Nome"]') as HTMLInputElement
    setReactInputValue(nomeInput, 'Teste')

    const salvarBtn = Array.from(container.querySelectorAll('button[type="submit"]'))[0] as HTMLButtonElement
    await act(async () => { salvarBtn.click() })

    expect(container.textContent).toContain('Erro ao salvar')
    cleanup()
  })

  it('validates empty password fields', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const senhaForms = container.querySelectorAll('form')
    const senhaForm = senhaForms[1]
    await act(async () => {
      senhaForm.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(container.textContent).toContain('Preencha todos os campos de senha')
    cleanup()
  })

  it('validates password mismatch', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const senhaAtualInput = container.querySelector('input[placeholder="Senha atual"]') as HTMLInputElement
    const novaSenhaInput = container.querySelector('input[placeholder="Nova senha (mínimo 6 caracteres)"]') as HTMLInputElement
    const confirmarInput = container.querySelector('input[placeholder="Confirmar nova senha"]') as HTMLInputElement

    setReactInputValue(senhaAtualInput, 'senha123')
    setReactInputValue(novaSenhaInput, 'novasenha')
    setReactInputValue(confirmarInput, 'outrasenha')

    const senhaForms = container.querySelectorAll('form')
    const senhaForm = senhaForms[1]
    await act(async () => {
      senhaForm.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(container.textContent).toContain('As senhas não conferem')
    cleanup()
  })

  it('validates password minimum length', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const senhaAtualInput = container.querySelector('input[placeholder="Senha atual"]') as HTMLInputElement
    const novaSenhaInput = container.querySelector('input[placeholder="Nova senha (mínimo 6 caracteres)"]') as HTMLInputElement
    const confirmarInput = container.querySelector('input[placeholder="Confirmar nova senha"]') as HTMLInputElement

    setReactInputValue(senhaAtualInput, 'senha123')
    setReactInputValue(novaSenhaInput, 'curta')
    setReactInputValue(confirmarInput, 'curta')

    const senhaForms = container.querySelectorAll('form')
    const senhaForm = senhaForms[1]
    await act(async () => {
      senhaForm.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(container.textContent).toContain('A nova senha deve ter pelo menos 6 caracteres')
    cleanup()
  })

  it('changes password successfully', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const senhaAtualInput = container.querySelector('input[placeholder="Senha atual"]') as HTMLInputElement
    const novaSenhaInput = container.querySelector('input[placeholder="Nova senha (mínimo 6 caracteres)"]') as HTMLInputElement
    const confirmarInput = container.querySelector('input[placeholder="Confirmar nova senha"]') as HTMLInputElement

    setReactInputValue(senhaAtualInput, 'senha123')
    setReactInputValue(novaSenhaInput, 'novasenha')
    setReactInputValue(confirmarInput, 'novasenha')

    const senhaForms = container.querySelectorAll('form')
    const senhaForm = senhaForms[1]
    await act(async () => {
      senhaForm.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(container.textContent).toContain('Senha alterada com sucesso')
    expect(senhaAtualInput.value).toBe('')
    expect(novaSenhaInput.value).toBe('')
    expect(confirmarInput.value).toBe('')
    cleanup()
  })

  it('shows error on password change failure', async () => {
    mockFetchHandler((url, init) => {
      if (url.includes('/usuario/me/senha') && init?.method === 'PATCH') {
        return new Error('Erro ao alterar senha')
      }
      return usuarioFake
    })
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const senhaAtualInput = container.querySelector('input[placeholder="Senha atual"]') as HTMLInputElement
    const novaSenhaInput = container.querySelector('input[placeholder="Nova senha (mínimo 6 caracteres)"]') as HTMLInputElement
    const confirmarInput = container.querySelector('input[placeholder="Confirmar nova senha"]') as HTMLInputElement

    setReactInputValue(senhaAtualInput, 'senha123')
    setReactInputValue(novaSenhaInput, 'novasenha')
    setReactInputValue(confirmarInput, 'novasenha')

    const senhaForms = container.querySelectorAll('form')
    const senhaForm = senhaForms[1]
    await act(async () => {
      senhaForm.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(container.textContent).toContain('Erro ao alterar senha')
    cleanup()
  })

  it('shows generic error on password change rejection', async () => {
    mockFetchHandler((url, init) => {
      if (url.includes('/usuario/me/senha') && init?.method === 'PATCH') {
        throw 'string error'
      }
      return usuarioFake
    })
    const { container, cleanup } = renderPage()
    await act(async () => {})

    const senhaAtualInput = container.querySelector('input[placeholder="Senha atual"]') as HTMLInputElement
    const novaSenhaInput = container.querySelector('input[placeholder="Nova senha (mínimo 6 caracteres)"]') as HTMLInputElement
    const confirmarInput = container.querySelector('input[placeholder="Confirmar nova senha"]') as HTMLInputElement

    setReactInputValue(senhaAtualInput, 'senha123')
    setReactInputValue(novaSenhaInput, 'novasenha')
    setReactInputValue(confirmarInput, 'novasenha')

    const senhaForms = container.querySelectorAll('form')
    const senhaForm = senhaForms[1]
    await act(async () => {
      senhaForm.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(container.textContent).toContain('Erro ao alterar senha')
    cleanup()
  })

  it('disables email input', async () => {
    mockFetchSuccess()
    const { container, cleanup } = renderPage()
    await act(async () => {})
    const emailInput = container.querySelector('input[placeholder="E-mail"]') as HTMLInputElement
    expect(emailInput.disabled).toBe(true)
    cleanup()
  })
})
