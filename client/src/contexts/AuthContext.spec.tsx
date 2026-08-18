import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, useAuth } from './AuthContext'
import { criarTokenFake } from '../test-utils'

function TestComponent() {
  const { user, isAutenticado, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="autenticado">{String(isAutenticado)}</span>
      <span data-testid="email">{user?.email ?? 'nenhum'}</span>
      <span data-testid="roles">{user?.roles.join(',') ?? 'nenhum'}</span>
      <button onClick={() => login(criarTokenFake({ sub: 42, email: 'a@b.com', roles: ['ORGANIZER'] }))}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

function renderWithAuth() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )
  })
  return { container, root }
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated without token', () => {
    const { container, root } = renderWithAuth()
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('false')
    expect(container.querySelector('[data-testid="email"]')?.textContent).toBe('nenhum')
    act(() => root.unmount())
  })

  it('starts authenticated with valid token in localStorage', () => {
    localStorage.setItem('token', criarTokenFake({ email: 'x@y.com', roles: ['CLIENT', 'ORGANIZER'] }))
    const { container, root } = renderWithAuth()
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('true')
    expect(container.querySelector('[data-testid="email"]')?.textContent).toBe('x@y.com')
    expect(container.querySelector('[data-testid="roles"]')?.textContent).toBe('CLIENT,ORGANIZER')
    act(() => root.unmount())
  })

  it('ignores expired token', () => {
    localStorage.setItem('token', criarTokenFake({ exp: Math.floor(Date.now() / 1000) - 100 }))
    const { container, root } = renderWithAuth()
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('false')
    act(() => root.unmount())
  })

  it('ignores invalid token', () => {
    localStorage.setItem('token', 'not-a-valid-token.at.all')
    const { container, root } = renderWithAuth()
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('false')
    act(() => root.unmount())
  })

  it('login sets token and user', () => {
    const { container, root } = renderWithAuth()
    act(() => {
      container.querySelector('button')!.click()
    })
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('true')
    expect(container.querySelector('[data-testid="email"]')?.textContent).toBe('a@b.com')
    expect(container.querySelector('[data-testid="roles"]')?.textContent).toBe('ORGANIZER')
    expect(localStorage.getItem('token')).toBeTruthy()
    act(() => root.unmount())
  })

  it('logout clears token and user', () => {
    localStorage.setItem('token', criarTokenFake({ email: 'x@y.com' }))
    const { container, root } = renderWithAuth()
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('true')
    const buttons = container.querySelectorAll('button')
    act(() => {
      buttons[1]!.click()
    })
    expect(container.querySelector('[data-testid="autenticado"]')?.textContent).toBe('false')
    expect(localStorage.getItem('token')).toBeNull()
    act(() => root.unmount())
  })

  it('throws when useAuth is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Bad() {
      useAuth()
      return null
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    expect(() => {
      act(() => {
        root.render(<Bad />)
      })
    }).toThrow('useAuth deve ser usado dentro de AuthProvider')
    spy.mockRestore()
  })
})
