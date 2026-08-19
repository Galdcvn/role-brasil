import { describe, expect, it, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'

function renderPage() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('HomePage', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows landing page when not logged in', () => {
    const { container, cleanup } = renderPage()
    expect(container.textContent).toContain('Plataforma de eventos e ingressos')
    cleanup()
  })

  it('redirects to portal when token exists', () => {
    localStorage.setItem('token', 'fake-token')
    const { container, cleanup } = renderPage()
    expect(container.textContent).not.toContain('Plataforma de eventos e ingressos')
    cleanup()
  })
})
