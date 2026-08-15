import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-100">
      <p className="text-6xl font-bold">404</p>
      <p className="text-neutral-400">Página não encontrada.</p>
      <Link to="/" className="text-amber-400 underline">
        Voltar ao início
      </Link>
    </main>
  )
}
