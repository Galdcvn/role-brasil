import { useEffect, useState } from 'react'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'

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

const CORES_RESULTADO: Record<string, string> = {
  APROVADO: 'bg-emerald-900/60 text-emerald-400',
  PENDENTE_DOCUMENTACAO: 'bg-yellow-900/60 text-yellow-400',
  REJEITADO: 'bg-red-900/60 text-red-400',
  DOCUMENTACAO_CONFIRMADA: 'bg-emerald-900/60 text-emerald-400',
  DOCUMENTACAO_RECUSADA: 'bg-red-900/60 text-red-400',
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

function formatarResultado(resultado: string): string {
  const labels: Record<string, string> = {
    APROVADO: 'Aprovado',
    PENDENTE_DOCUMENTACAO: 'Pend. Doc.',
    REJEITADO: 'Rejeitado',
    DOCUMENTACAO_CONFIRMADA: 'Doc. Confirmada',
    DOCUMENTACAO_RECUSADA: 'Doc. Recusada',
  }
  return labels[resultado] ?? resultado
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
      <div className="space-y-4">
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Histórico</h1>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {scans.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum scan realizado ainda.</p>
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
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          CORES_RESULTADO[scan.resultado] ?? 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {formatarResultado(scan.resultado)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {scan.ingresso.categoria} — Assento {scan.ingresso.codigo}
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
