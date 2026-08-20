import { Navigate } from 'react-router-dom'
import logoTexto from '../assets/RB_Logo_Texto.png'

export default function HomePage() {
  const token = localStorage.getItem('token')

  if (token) {
    return <Navigate to="/portal" replace />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <img src={logoTexto} alt="Rolê Brasil" className="h-16" />
      <p className="text-slate-400">
        Plataforma de eventos e ingressos
      </p>
    </main>
  )
}
