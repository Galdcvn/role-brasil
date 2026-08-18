import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './AuthContext'
import { PortalProvider, usePortal } from './PortalContext'
import { criarTokenFake } from '../test-utils'

function TestComponent() {
  const { roleAtivo, setRoleAtivo, papeisDisponiveis } = usePortal()
  return (
    <div>
      <span data-testid="roleAtivo">{roleAtivo}</span>
      <span data-testid="papeis">{papeisDisponiveis.join(',')}</span>
      <button onClick={() => setRoleAtivo('ORGANIZER')}>mudar</button>
      <button onClick={() => setRoleAtivo('INVALID')}>invalido</button>
    </div>
  )
}

function renderWithProviders(token: string) {
  localStorage.setItem('token', token)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <AuthProvider>
        <PortalProvider>
          <TestComponent />
        </PortalProvider>
      </AuthProvider>,
    )
  })
  return { container, root }
}

describe('PortalContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to first role', () => {
    const token = criarTokenFake({ roles: ['CLIENT', 'ORGANIZER'] })
    const { container, root } = renderWithProviders(token)
    expect(container.querySelector('[data-testid="roleAtivo"]')?.textContent).toBe('CLIENT')
    expect(container.querySelector('[data-testid="papeis"]')?.textContent).toBe('CLIENT,ORGANIZER')
    act(() => root.unmount())
  })

  it('defaults to CLIENT when no roles', () => {
    const token = criarTokenFake({ roles: [] })
    const { container, root } = renderWithProviders(token)
    expect(container.querySelector('[data-testid="roleAtivo"]')?.textContent).toBe('CLIENT')
    act(() => root.unmount())
  })

  it('switches role when valid', () => {
    const token = criarTokenFake({ roles: ['CLIENT', 'ORGANIZER'] })
    const { container, root } = renderWithProviders(token)
    const buttons = container.querySelectorAll('button')
    act(() => {
      buttons[0]!.click()
    })
    expect(container.querySelector('[data-testid="roleAtivo"]')?.textContent).toBe('ORGANIZER')
    act(() => root.unmount())
  })

  it('ignores invalid role', () => {
    const token = criarTokenFake({ roles: ['CLIENT'] })
    const { container, root } = renderWithProviders(token)
    const buttons = container.querySelectorAll('button')
    act(() => {
      buttons[1]!.click()
    })
    expect(container.querySelector('[data-testid="roleAtivo"]')?.textContent).toBe('CLIENT')
    act(() => root.unmount())
  })

  it('throws when usePortal is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT'] }))
    function Bad() {
      usePortal()
      return null
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    expect(() => {
      act(() => {
        root.render(
          <AuthProvider>
            <Bad />
          </AuthProvider>,
        )
      })
    }).toThrow('usePortal deve ser usado dentro de PortalProvider')
    spy.mockRestore()
  })
})
