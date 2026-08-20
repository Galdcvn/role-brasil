import { useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import logo from '../../assets/RB_Logo.png'

interface Props {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: Props) {
  const { user } = useAuth()
  const [emTelaCheia, setEmTelaCheia] = useState(false)

  const isPortaria = user?.roles?.includes('PORTARIA') ?? false

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setEmTelaCheia(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setEmTelaCheia(false)).catch(() => {})
    }
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Abrir menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <img src={logo} alt="Rolê Brasil" className="h-10 lg:hidden" />
      </div>

      <div className="flex items-center gap-3">
        {isPortaria && (
          <button
            onClick={toggleFullscreen}
            className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title={emTelaCheia ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
          >
            {emTelaCheia ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
