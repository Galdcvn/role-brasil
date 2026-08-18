import { describe, expect, it, beforeEach } from 'vitest'
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
  return { container, root }
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the login page on "/login"', () => {
    const { container, root } = renderAt(['/login'])
    expect(container.textContent).toContain('Entrar')
    expect(container.textContent).toContain('Esqueceu a senha?')
    act(() => root.unmount())
  })

  it('renders the registro page on "/registro"', () => {
    const { container, root } = renderAt(['/registro'])
    expect(container.textContent).toContain('Cadastrar')
    expect(container.textContent).toContain('Já tem uma conta?')
    act(() => root.unmount())
  })

  it('redirects to /login when not authenticated on "/"', () => {
    const { container, root } = renderAt(['/'])
    expect(container.textContent).toContain('Entrar')
    expect(container.textContent).toContain('Esqueceu a senha?')
    act(() => root.unmount())
  })

  it('renders the home page on "/" when authenticated', () => {
    localStorage.setItem('token', 'fake-jwt')
    const { container, root } = renderAt(['/'])
    expect(container.textContent).toContain('Rolê Brasil')
    act(() => root.unmount())
  })

  it('redirects unknown routes to the 404 page', () => {
    const { container, root } = renderAt(['/rota-inexistente'])
    expect(container.textContent).toContain('Página não encontrada.')
    act(() => root.unmount())
  })
})
