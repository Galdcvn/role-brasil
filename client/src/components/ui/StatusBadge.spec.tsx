import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import StatusBadge from './StatusBadge'

function renderBadge(status: string) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(<StatusBadge status={status} />)
  })
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('StatusBadge', () => {
  it('renders the status text', () => {
    const { container, cleanup } = renderBadge('PUBLICADO')
    expect(container.textContent).toContain('Publicado')
    cleanup()
  })

  it('applies green class for PUBLICADO', () => {
    const { container, cleanup } = renderBadge('PUBLICADO')
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('text-emerald-400')
    cleanup()
  })

  it('applies red class for CANCELADO', () => {
    const { container, cleanup } = renderBadge('CANCELADO')
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('text-red-400')
    cleanup()
  })

  it('applies slate class for unknown status', () => {
    const { container, cleanup } = renderBadge('UNKNOWN')
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('text-slate-300')
    cleanup()
  })
})
