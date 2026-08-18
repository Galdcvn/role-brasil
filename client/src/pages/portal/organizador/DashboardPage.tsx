import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'

interface StatsOrganizador {
  totalEventos: number
  eventosPorStatus: Record<string, number>
  totalReservas: number
  totalReceitaCentavos: number
  totalIngressos: number
}

interface EventoResumo {
  id: number
  titulo: string
  posterUrl: string | null
  status: string
  criadoEm: string
  _count: { sessoes: number }
}

function formatarCentavos(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOrganizador | null>(null)
  const [eventos, setEventos] = useState<EventoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api<StatsOrganizador>('/stats/organizador'), api<EventoResumo[]>('/eventos')])
      .then(([s, e]) => { setStats(s); setEventos(e) })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
        <p className="text-red-400">{erro}</p>
      </div>
    )
  }

  if (stats && stats.totalEventos === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
        <EmptyState
          titulo="Bem-vindo ao Rolê Brasil!"
          descricao="Você ainda não criou nenhum evento. Comece agora para ver suas métricas aqui."
          ctaLabel="Criar Primeiro Evento"
          ctaTo="/portal/organizador/evento/novo"
        />
      </div>
    )
  }

  const ultimosEventos = eventos.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <p className="text-xs text-slate-400">Eventos</p>
            <p className="text-2xl font-bold text-white">{stats.totalEventos}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-400">Reservas</p>
            <p className="text-2xl font-bold text-white">{stats.totalReservas}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-400">Receita</p>
            <p className="text-2xl font-bold text-[#00FF88]">
              {formatarCentavos(stats.totalReceitaCentavos)}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate-400">Ingressos</p>
            <p className="text-2xl font-bold text-white">{stats.totalIngressos}</p>
          </Card>
        </div>
      )}

      {stats && Object.keys(stats.eventosPorStatus).length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Por Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.eventosPorStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-xs text-slate-400">{status}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Últimos Eventos</h2>
          <Link to="/portal/organizador/eventos" className="text-xs text-[#00FF88] hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="space-y-2">
          {ultimosEventos.map((ev) => (
            <Link key={ev.id} to={`/portal/organizador/evento/${ev.id}`}>
              <Card className="flex items-center gap-3">
                {ev.posterUrl ? (
                  <img src={ev.posterUrl} alt="" className="h-10 w-8 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-8 items-center justify-center rounded bg-slate-800 text-xs text-slate-500">&#9744;</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{ev.titulo}</p>
                  <p className="text-xs text-slate-400">{ev._count.sessoes} sessões</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  ev.status === 'PUBLICADO' ? 'bg-emerald-900/60 text-emerald-400' :
                  ev.status === 'CANCELADO' ? 'bg-red-900/60 text-red-400' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {ev.status}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
