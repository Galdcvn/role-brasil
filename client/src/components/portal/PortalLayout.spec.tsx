import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { PortalProvider } from '../../contexts/PortalContext'
import PortalLayout from './PortalLayout'
import { criarTokenFake } from '../../test-utils'

function renderLayout(entry = '/portal/cliente') {
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
              <Route element={<PortalLayout />}>
                <Route path="/portal/cliente" element={<div data-testid="outlet">Outlet Content</div>} />
                <Route path="/portal/organizador" element={<div data-testid="outlet">Outlet Content</div>} />
                <Route path="/portal/portaria" element={<div data-testid="outlet">Outlet Content</div>} />
              </Route>
            </Routes>
          </PortalProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('PortalLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders sidebar and header', () => {
    const { container, cleanup } = renderLayout()
    const aside = container.querySelector('aside')
    expect(aside).toBeTruthy()
    const header = container.querySelector('header')
    expect(header).toBeTruthy()
    cleanup()
  })

  it('renders outlet content', () => {
    const { container, cleanup } = renderLayout()
    expect(container.querySelector('[data-testid="outlet"]')).toBeTruthy()
    expect(container.textContent).toContain('Outlet Content')
    cleanup()
  })

  it('sidebar is hidden by default on mobile', () => {
    const { container, cleanup } = renderLayout()
    const aside = container.querySelector('aside')!
    expect(aside.className).toContain('-translate-x-full')
    cleanup()
  })

  it('opens sidebar when hamburger is clicked', async () => {
    const { container, cleanup } = renderLayout()
    const hamburger = container.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement
    expect(hamburger).toBeTruthy()
    await act(async () => { hamburger.click() })
    const aside = container.querySelector('aside')!
    expect(aside.className).toContain('translate-x-0')
    const overlay = container.querySelector('.fixed.inset-0')
    expect(overlay).toBeTruthy()
    cleanup()
  })

  it('closes sidebar when overlay is clicked', async () => {
    const { container, cleanup } = renderLayout()
    const hamburger = container.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement
    await act(async () => { hamburger.click() })

    const overlay = container.querySelector('.fixed.inset-0.z-40') as HTMLDivElement
    expect(overlay).toBeTruthy()
    await act(async () => { overlay.click() })

    const aside = container.querySelector('aside')!
    expect(aside.className).toContain('-translate-x-full')
    cleanup()
  })

  it('renders logo in sidebar', () => {
    const { container, cleanup } = renderLayout()
    const logo = container.querySelector('aside img[alt="Rolê Brasil"]')
    expect(logo).toBeTruthy()
    cleanup()
  })

  it('renders sidebar nav items', () => {
    const { container, cleanup } = renderLayout()
    expect(container.textContent).toContain('Início')
    expect(container.textContent).toContain('Favoritos')
    expect(container.textContent).toContain('Ingressos')
    expect(container.textContent).toContain('Meu Perfil')
    cleanup()
  })

  it('highlights active nav item', () => {
    const { container, cleanup } = renderLayout('/portal/cliente')
    const activeLink = container.querySelector('aside a.bg-\\[\\#00FF88\\]\\/10')
    expect(activeLink).toBeTruthy()
    expect(activeLink!.textContent).toContain('Início')
    cleanup()
  })

  it('has main content area with overflow', () => {
    const { container, cleanup } = renderLayout()
    const main = container.querySelector('main')
    expect(main).toBeTruthy()
    expect(main!.className).toContain('overflow-y-auto')
    cleanup()
  })
})
