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

  it('displays user email', () => {
    const { container, cleanup } = renderHeader(vi.fn(), ['CLIENT'])
    expect(container.textContent).toContain('test@test.com')
    cleanup()
  })

  it('calls logout when Sair button is clicked', async () => {
    const { container, cleanup } = renderHeader(vi.fn(), ['CLIENT'])
    const logoutBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sair'),
    ) as HTMLButtonElement
    expect(logoutBtn).toBeTruthy()
    await act(async () => { logoutBtn.click() })
    expect(localStorage.getItem('token')).toBeNull()
    cleanup()
  })

  it('toggles fullscreen when PORTARIA clicks fullscreen button', async () => {
    const { container, cleanup } = renderHeader(vi.fn(), ['PORTARIA'])
    const fullscreenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.getAttribute('title')?.includes('tela cheia'),
    ) as HTMLButtonElement

    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    await act(async () => { fullscreenBtn.click() })
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled()

    Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true })
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined)
    await act(async () => { fullscreenBtn.click() })
    expect(document.exitFullscreen).toHaveBeenCalled()
    cleanup()
  })

  it('handles fullscreen request failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container, cleanup } = renderHeader(vi.fn(), ['PORTARIA'])
    const fullscreenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.getAttribute('title')?.includes('tela cheia'),
    ) as HTMLButtonElement

    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    document.documentElement.requestFullscreen = vi.fn().mockRejectedValue(new Error('denied'))
    await act(async () => { fullscreenBtn.click() })
    expect(fullscreenBtn).toBeTruthy()
    spy.mockRestore()
    cleanup()
  })

  it('handles exit fullscreen failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container, cleanup } = renderHeader(vi.fn(), ['PORTARIA'])
    const fullscreenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.getAttribute('title')?.includes('tela cheia'),
    ) as HTMLButtonElement

    Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true })
    document.exitFullscreen = vi.fn().mockRejectedValue(new Error('denied'))
    await act(async () => { fullscreenBtn.click() })
    expect(fullscreenBtn).toBeTruthy()
    spy.mockRestore()
    cleanup()
  })

  it('shows logo image', () => {
    const { container, cleanup } = renderHeader()
    const img = container.querySelector('img[alt="Rolê Brasil"]')
    expect(img).toBeTruthy()
    cleanup()
  })

  it('hides email on small screens', () => {
    const { container, cleanup } = renderHeader()
    const emailSpan = container.querySelector('span.hidden.sm\\:block')
    expect(emailSpan).toBeTruthy()
    expect(emailSpan!.textContent).toContain('test@test.com')
    cleanup()
  })

  it('shows PORTARIA role with fullscreen entry icon after exiting fullscreen', async () => {
    const { container, cleanup } = renderHeader(vi.fn(), ['PORTARIA'])
    const fullscreenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.getAttribute('title')?.includes('tela cheia'),
    ) as HTMLButtonElement

    Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true })
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined)
    await act(async () => { fullscreenBtn.click() })

    expect(fullscreenBtn.getAttribute('title')).toContain('Entrar em tela cheia')
    cleanup()
  })
})
