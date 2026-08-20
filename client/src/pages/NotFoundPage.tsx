import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <p className="text-6xl font-bold">404</p>
      <p className="text-slate-400">Página não encontrada.</p>
      <Link to="/" className="text-[#00FF88] underline">
        Voltar ao início
      </Link>
    </main>
  )
}
