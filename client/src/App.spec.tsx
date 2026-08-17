import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

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
  return { container, root }
}

describe('App', () => {
  it('renders the home page on "/"', () => {
    const { container, root } = renderAt(['/'])
    expect(container.textContent).toContain('Rolê Brasil')
    act(() => root.unmount())
  })

  it('redirects unknown routes to the 404 page', () => {
    const { container, root } = renderAt(['/rota-inexistente'])
    expect(container.textContent).toContain('Página não encontrada.')
    act(() => root.unmount())
  })
})
