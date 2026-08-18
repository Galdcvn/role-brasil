import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import Card from './Card'

function renderCard(props: React.ComponentProps<typeof Card>) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(<Card {...props} />)
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('Card', () => {
  it('renders children', () => {
    const { container, cleanup } = renderCard({ children: 'Conteúdo' })
    expect(container.textContent).toContain('Conteúdo')
    cleanup()
  })

  it('applies custom className', () => {
    const { container, cleanup } = renderCard({ children: 'Teste', className: 'custom-class' })
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('custom-class')
    cleanup()
  })

  it('renders without onClick as non-clickable', () => {
    const { container, cleanup } = renderCard({ children: 'Sem click' })
    const div = container.firstChild as HTMLElement
    expect(div.className).not.toContain('cursor-pointer')
    cleanup()
  })

  it('renders with onClick as clickable', () => {
    const { container, cleanup } = renderCard({ children: 'Com click', onClick: () => {} })
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('cursor-pointer')
    cleanup()
  })
})
