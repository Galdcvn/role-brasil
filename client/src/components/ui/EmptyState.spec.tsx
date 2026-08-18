import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import EmptyState from './EmptyState'

function renderEmpty(props: React.ComponentProps<typeof EmptyState>) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <EmptyState {...props} />
      </MemoryRouter>,
    )
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('EmptyState', () => {
  it('renders title and description', () => {
    const { container, cleanup } = renderEmpty({ titulo: 'Vazio', descricao: 'Nada aqui' })
    expect(container.textContent).toContain('Vazio')
    expect(container.textContent).toContain('Nada aqui')
    cleanup()
  })

  it('renders CTA link when ctaTo is provided', () => {
    const { container, cleanup } = renderEmpty({ titulo: 'T', descricao: 'D', ctaLabel: 'Criar', ctaTo: '/criar' })
    const link = container.querySelector('a[href="/criar"]')
    expect(link).toBeTruthy()
    expect(link?.textContent).toContain('Criar')
    cleanup()
  })

  it('renders CTA button when onCtaClick is provided', () => {
    const onClick = vi.fn()
    const { container, cleanup } = renderEmpty({ titulo: 'T', descricao: 'D', ctaLabel: 'Ação', onCtaClick: onClick })
    const btn = container.querySelector('button')
    expect(btn).toBeTruthy()
    expect(btn?.textContent).toContain('Ação')
    cleanup()
  })

  it('does not render CTA when none provided', () => {
    const { container, cleanup } = renderEmpty({ titulo: 'T', descricao: 'D' })
    expect(container.querySelector('a')).toBeFalsy()
    expect(container.querySelector('button')).toBeFalsy()
    cleanup()
  })
})
