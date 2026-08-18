import { describe, expect, it, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { criarTokenFake } from './test-utils'

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

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the login page on "/login"', () => {
    const { container, cleanup } = renderAt(['/login'])
    expect(container.textContent).toContain('Entrar')
    expect(container.textContent).toContain('Esqueceu a senha?')
    cleanup()
  })

  it('renders the role selection page on "/registro"', () => {
    const { container, cleanup } = renderAt(['/registro'])
    expect(container.textContent).toContain('Como você quer participar?')
    expect(container.textContent).toContain('Cliente')
    expect(container.textContent).toContain('Organizador')
    expect(container.textContent).toContain('Portaria')
    cleanup()
  })

  it('renders the CLIENT registration form on "/registro/cliente"', () => {
    const { container, cleanup } = renderAt(['/registro/cliente'])
    expect(container.textContent).toContain('Crie sua conta.')
    expect(container.textContent).toContain('Cadastrar')
    cleanup()
  })

  it('renders the ORGANIZER registration form on "/registro/organizador"', () => {
    const { container, cleanup } = renderAt(['/registro/organizador'])
    expect(container.textContent).toContain('Crie sua conta de Organizador.')
    expect(container.textContent).toContain('Cadastrar como Organizador')
    cleanup()
  })

  it('renders the PORTARIA registration form on "/registro/portaria"', () => {
    const { container, cleanup } = renderAt(['/registro/portaria'])
    expect(container.textContent).toContain('Crie sua conta de Portaria.')
    expect(container.textContent).toContain('Cadastrar como Portaria')
    cleanup()
  })

  it('redirects to /login when not authenticated on "/"', () => {
    const { container, cleanup } = renderAt(['/'])
    expect(container.textContent).toContain('Entrar')
    expect(container.textContent).toContain('Esqueceu a senha?')
    cleanup()
  })

  it('renders the home page on "/" when authenticated', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT'] }))
    const { container, cleanup } = renderAt(['/'])
    expect(container.textContent).toContain('Rolê Brasil')
    cleanup()
  })

  it('redirects to /login when not authenticated on "/portal"', () => {
    const { container, cleanup } = renderAt(['/portal'])
    expect(container.textContent).toContain('Entrar')
    cleanup()
  })

  it('renders the portal on "/portal" when authenticated', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal'])
    expect(container.textContent).toContain('Rolê Brasil')
    cleanup()
  })

  it('redirects unknown routes to the 404 page', () => {
    const { container, cleanup } = renderAt(['/rota-inexistente'])
    expect(container.textContent).toContain('Página não encontrada.')
    cleanup()
  })

  it('renders portal sidebar with ORGANIZER sections', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador'])
    expect(container.textContent).toContain('Dashboard')
    expect(container.textContent).toContain('Eventos')
    expect(container.textContent).toContain('Criar Evento')
    expect(container.textContent).toContain('Relatórios')
    cleanup()
  })

  it('renders the Dashboard page content', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador'])
    expect(container.textContent).toContain('Visão geral dos seus eventos')
    cleanup()
  })

  it('renders portal sub-pages', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador/eventos'])
    expect(container.textContent).toContain('Lista de eventos criados por você')
    cleanup()
  })

  it('renders Novo Evento and Relatórios pages', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador/evento/novo'])
    expect(container.textContent).toContain('Formulário de criação de evento')
    cleanup()
  })

  it('shows user email in header', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'], email: 'org@test.com' }))
    const { container, cleanup } = renderAt(['/portal/organizador'])
    expect(container.textContent).toContain('org@test.com')
    expect(container.textContent).toContain('Sair')
    cleanup()
  })

  it('renders the cliente placeholder', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT'] }))
    const { container, cleanup } = renderAt(['/portal/cliente'])
    expect(container.textContent).toContain('Em breve')
    cleanup()
  })

  it('shows both CLIENT and ORGANIZER sections in sidebar', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['CLIENT', 'ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador'])
    expect(container.textContent).toContain('Cliente')
    expect(container.textContent).toContain('Organizador')
    expect(container.textContent).toContain('Dashboard')
    cleanup()
  })

  it('renders the Relatórios page', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador/relatorios'])
    expect(container.textContent).toContain('Relatórios de vendas e ocupação')
    cleanup()
  })

  it('toggles password visibility on login', () => {
    const { container, cleanup } = renderAt(['/login'])
    const input = container.querySelector('input[type="password"]') as HTMLInputElement
    expect(input).toBeTruthy()
    const toggle = container.querySelector('button[aria-label="Exibir senha"]') as HTMLButtonElement
    expect(toggle).toBeTruthy()
    act(() => toggle.click())
    expect(container.querySelector('input[type="text"]')).toBeTruthy()
    const hideBtn = container.querySelector('button[aria-label="Ocultar senha"]') as HTMLButtonElement
    expect(hideBtn).toBeTruthy()
    act(() => hideBtn.click())
    expect(container.querySelector('input[type="password"]')).toBeTruthy()
    cleanup()
  })

  it('opens sidebar on mobile via menu button', () => {
    localStorage.setItem('token', criarTokenFake({ roles: ['ORGANIZER'] }))
    const { container, cleanup } = renderAt(['/portal/organizador'])
    const menuBtn = container.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement
    expect(menuBtn).toBeTruthy()
    act(() => menuBtn.click())
    const overlay = container.querySelector('.fixed.inset-0')
    expect(overlay).toBeTruthy()
    act(() => (overlay as HTMLElement).click())
    cleanup()
  })
})
