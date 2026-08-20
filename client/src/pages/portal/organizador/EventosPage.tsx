import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'
import EmptyState from '../../../components/ui/EmptyState'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

interface EventoResumo {
  id: number
  titulo: string
  posterUrl: string | null
  status: string
  criadoEm: string
  _count: { sessoes: number }
}

export default function EventosPage() {
  useDocumentTitle('Meus Eventos')
  const [eventos, setEventos] = useState<EventoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)

  function carregar() {
    setLoading(true)
    setErro(null)
    api<EventoResumo[]>('/eventos')
      .then(setEventos)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao carregar eventos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      const matchBusca = !busca || ev.titulo.toLowerCase().includes(busca.toLowerCase())
      const matchStatus = !filtroStatus || ev.status === filtroStatus
      return matchBusca && matchStatus
    })
  }, [eventos, busca, filtroStatus])

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Meus Eventos</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Meus Eventos</h1>
        <p className="text-red-400">{erro}</p>
        <button onClick={carregar} className="mt-2 text-sm text-[#00FF88] hover:underline">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Eventos</h1>
        <Link
          to="/portal/organizador/evento/novo"
          className="rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          + Criar Evento
        </Link>
      </div>

      {eventos.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Buscar evento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none sm:w-64"
          />
          <select
            value={filtroStatus ?? ''}
            onChange={(e) => setFiltroStatus(e.target.value || null)}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-[#00FF88] focus:outline-none sm:w-48"
          >
            <option value="">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADO">Publicado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      )}

      {eventos.length === 0 ? (
        <EmptyState
          titulo="Nenhum evento criado"
          descricao="Comece criando seu primeiro evento para vender ingressos."
          ctaLabel="Criar Primeiro Evento"
          ctaTo="/portal/organizador/evento/novo"
        />
      ) : eventosFiltrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum evento encontrado"
          descricao="Tente ajustar os filtros ou criar um novo evento."
        />
      ) : (
        <div className="space-y-3">
          {eventosFiltrados.map((ev) => (
            <Link key={ev.id} to={`/portal/organizador/evento/${ev.id}`}>
              <Card className="flex items-center gap-4">
                {ev.posterUrl ? (
                  <img
                    src={ev.posterUrl}
                    alt={ev.titulo}
                    className="h-16 w-12 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded bg-slate-800 text-lg text-slate-500">
                    🎬
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{ev.titulo}</h3>
                  <p className="text-xs text-slate-400">
                    {ev._count.sessoes} {ev._count.sessoes === 1 ? 'sessão' : 'sessões'}
                  </p>
                </div>
                <StatusBadge status={ev.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
