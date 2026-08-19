import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import Header from './Header'
import { criarTokenFake } from '../../test-utils'

function renderHeader(onMenuClick = vi.fn(), roles: string[] = ['CLIENT']) {
  localStorage.setItem('token', criarTokenFake({ roles }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthProvider>
          <Header onMenuClick={onMenuClick} />
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('Header', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('shows fullscreen button for PORTARIA role', () => {
    const { container, cleanup } = renderHeader(vi.fn(), ['PORTARIA'])
    const fullscreenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.getAttribute('title')?.includes('tela cheia'),
    )
    expect(fullscreenBtn).toBeTruthy()
    cleanup()
  })

  it('hides fullscreen button for non-PORTARIA role', () => {
    const { container, cleanup } = renderHeader(vi.fn(), ['CLIENT'])
    const fullscreenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.getAttribute('title')?.includes('tela cheia'),
    )
    expect(fullscreenBtn).toBeFalsy()
    cleanup()
  })

  it('calls onMenuClick when hamburger is clicked', async () => {
    const onMenuClick = vi.fn()
    const { container, cleanup } = renderHeader(onMenuClick)
    const hamburger = container.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement
    await act(async () => { hamburger.click() })
    expect(onMenuClick).toHaveBeenCalled()
    cleanup()
  })
})
