import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api'
import StatusBadge from '../../../components/ui/StatusBadge'
import EmptyState from '../../../components/ui/EmptyState'

interface Ingresso {
  id: number
  codigo: string
  status: string
  criadoEm: string
  sessao: {
    dataHora: string
    evento: { id: number; titulo: string; posterUrl: string | null }
    assento: { fileira: string; numero: number } | null
  }
  reserva: {
    itens: { categoria: string }[]
  }
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function IngressosPage() {
  const navigate = useNavigate()
  const [ingressos, setIngressos] = useState<Ingresso[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const data = await api<Ingresso[]>('/ingressos')
        setIngressos(data)
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const ingressosFiltrados = filtro
    ? ingressos.filter((i) => i.status === filtro)
    : ingressos

  const emitidos = ingressos.filter((i) => i.status === 'EMITIDO').length
  const disponiveis = ingressos.filter((i) => i.status === 'PENDENTE').length

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Meus Ingressos</h1>

      {!erro && ingressos.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFiltro(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !filtro
                ? 'bg-[#00FF88]/20 text-[#00FF88]'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({ingressos.length})
          </button>
          <button
            onClick={() => setFiltro('EMITIDO')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === 'EMITIDO'
                ? 'bg-[#00FF88]/20 text-[#00FF88]'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Emitidos ({emitidos})
          </button>
          <button
            onClick={() => setFiltro('PENDENTE')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === 'PENDENTE'
                ? 'bg-[#00FF88]/20 text-[#00FF88]'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Pendentes ({disponiveis})
          </button>
        </div>
      )}

      {erro ? (
        <p className="text-red-400">{erro}</p>
      ) : ingressos.length === 0 ? (
        <EmptyState
          titulo="Nenhum ingresso encontrado"
          descricao="Compre ingressos em eventos disponíveis para vê-los aqui."
          ctaLabel="Explorar Eventos"
          onCtaClick={() => navigate('/portal/cliente')}
        />
      ) : ingressosFiltrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum ingresso nesta categoria"
          descricao="Nenhum ingresso encontrado com o filtro selecionado."
          ctaLabel="Limpar Filtro"
          onCtaClick={() => setFiltro(null)}
        />
      ) : (
        <div className="space-y-2">
          {ingressosFiltrados.map((ing) => (
            <Link
              key={ing.id}
              to={`/portal/cliente/ingressos/${ing.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/50 p-3 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                {ing.sessao.evento.posterUrl ? (
                  <img
                    src={ing.sessao.evento.posterUrl}
                    alt={ing.sessao.evento.titulo}
                    className="h-16 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-slate-800 text-lg text-slate-600">
                    🎫
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{ing.sessao.evento.titulo}</h3>
                  <p className="text-xs text-slate-400">
                    {formatarData(ing.sessao.dataHora)}
                    {ing.sessao.assento && ` — ${ing.sessao.assento.fileira}${ing.sessao.assento.numero}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ing.reserva.itens[0]?.categoria}
                  </p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={ing.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
