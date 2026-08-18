import { useEffect, useState } from 'react'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'

interface EventoResumo {
  id: number
  titulo: string
  status: string
  _count: { sessoes: number }
}

interface Metricas {
  reservasTotais: number
  valorArrecadado: number
  reservasPorSessao: Array<{ sessaoId: number; reservas: number; valor: number }>
  ingressosPorCategoria: Array<{ categoria: string; count: number }>
}

interface EventoCompleto extends EventoResumo {
  metricas: Metricas
}

function formatarCentavos(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

export default function RelatoriosPage() {
  const [eventos, setEventos] = useState<EventoResumo[]>([])
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(null)
  const [detalhe, setDetalhe] = useState<EventoCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    api<EventoResumo[]>('/eventos')
      .then((evts) => {
        setEventos(evts)
        if (evts.length > 0) setEventoSelecionadoId(evts[0].id)
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (eventoSelecionadoId === null) return
    setCarregandoDetalhe(true)
    api<EventoCompleto>(`/eventos/${eventoSelecionadoId}`)
      .then(setDetalhe)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setCarregandoDetalhe(false))
  }, [eventoSelecionadoId])

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Relatórios</h1>
        <div className="h-10 w-64 animate-pulse rounded bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      {eventos.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum evento criado ainda.</p>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Selecionar evento</label>
            <select
              value={eventoSelecionadoId ?? ''}
              onChange={(e) => setEventoSelecionadoId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3 text-sm text-white focus:border-[#00FF88] focus:outline-none"
            >
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.titulo}</option>
              ))}
            </select>
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          {carregandoDetalhe ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : detalhe && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Card>
                  <p className="text-xs text-slate-400">Reservas Totais</p>
                  <p className="text-2xl font-bold text-white">{detalhe.metricas.reservasTotais}</p>
                </Card>
                <Card>
                  <p className="text-xs text-slate-400">Receita Total</p>
                  <p className="text-2xl font-bold text-[#00FF88]">
                    {formatarCentavos(detalhe.metricas.valorArrecadado)}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-slate-400">Sessões</p>
                  <p className="text-2xl font-bold text-white">{detalhe._count.sessoes}</p>
                </Card>
              </div>

              {detalhe.metricas.reservasPorSessao.length > 0 && (
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-slate-300">Reservas por Sessão</h2>
                  <div className="space-y-2">
                    {detalhe.metricas.reservasPorSessao.map((s) => (
                      <div key={s.sessaoId} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                        <span className="text-slate-400">Sessão #{s.sessaoId}</span>
                        <div className="flex gap-4">
                          <span className="text-white">{s.reservas} reservas</span>
                          <span className="font-semibold text-[#00FF88]">{formatarCentavos(s.valor)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {detalhe.metricas.ingressosPorCategoria.length > 0 && (
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-slate-300">Ingressos por Categoria</h2>
                  <div className="space-y-2">
                    {detalhe.metricas.ingressosPorCategoria.map((c) => (
                      <div key={c.categoria} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{c.categoria}</span>
                        <span className="font-semibold text-white">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
