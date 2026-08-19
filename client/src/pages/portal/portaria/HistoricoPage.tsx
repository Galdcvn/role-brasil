import { useEffect, useState } from 'react'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'
import EmptyState from '../../../components/ui/EmptyState'

interface Scan {
  portariaId: number
  ingressoId: number
  resultado: string
  observacao: string | null
  criadoEm: string
  ingresso: {
    id: number
    codigo: string
    categoria: string
    status: string
    comprovanteStatus: string
    reserva: {
      sessao: {
        id: number
        dataHora: string
        evento: {
          id: number
          titulo: string
          posterUrl: string | null
        }
      }
    }
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

export default function HistoricoPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    api<Scan[]>('/portaria/historico')
      .then(setScans)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Histórico</h1>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Histórico</h1>

      {erro && (
        <Card className="border-red-500/60 bg-red-900/20">
          <p className="text-sm text-red-400">{erro}</p>
        </Card>
      )}

      {!erro && scans.length === 0 ? (
        <EmptyState
          titulo="Nenhum scan realizado ainda"
          descricao="Valide ingressos na aba anterior para vê-los aqui."
        />
      ) : (
        <div className="space-y-2">
          {scans.map((scan, idx) => {
            const evento = scan.ingresso.reserva.sessao.evento
            return (
              <Card key={`${scan.ingressoId}-${idx}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {evento.titulo}
                      </p>
                      <StatusBadge status={scan.resultado} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {scan.ingresso.categoria} — {scan.ingresso.codigo}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatarData(scan.criadoEm)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
