import { useEffect, useState } from 'react'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { formatarCentavos } from '../../../utils/formatarCentavos'

interface EventoResumo {
  id: number
  titulo: string
  status: string
  _count: { sessoes: number }
}

interface Metricas {
  reservasTotais: number
  valorArrecadado: number
  reservasPorSessao: Array<{ sessaoId: number; dataHora: string; total: number }>
  valorArrecadadoPorSessao: Array<{ sessaoId: number; dataHora: string; total: number }>
  ingressosPorCategoria: Record<string, number>
  ingressosPorCategoriaPorSessao: Array<{
    sessaoId: number
    dataHora: string
    porCategoria: Record<string, number>
  }>
}

interface EventoCompleto {
  id: number
  titulo: string
  status: string
  sessoes: Array<{ id: number; dataHora: string; status: string }>
  metricas: Metricas
}

export default function RelatoriosPage() {
  useDocumentTitle('Relatórios')
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
                  <p className="text-2xl font-bold text-white">{detalhe.sessoes.length}</p>
                </Card>
              </div>

              {detalhe.metricas.reservasPorSessao.length > 0 && (
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-slate-300">Reservas por Sessão</h2>
                  <div className="space-y-2">
                    {detalhe.metricas.reservasPorSessao.map((s) => (
                      <div key={s.sessaoId} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                        <span className="text-slate-400">
                          {new Date(s.dataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex gap-4">
                          <span className="text-white">{s.total} reservas</span>
                          <span className="font-semibold text-[#00FF88]">
                            {formatarCentavos(
                              detalhe.metricas.valorArrecadadoPorSessao.find(
                                (v) => v.sessaoId === s.sessaoId,
                              )?.total ?? 0,
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {Object.entries(detalhe.metricas.ingressosPorCategoria).filter(([, c]) => c > 0).length > 0 && (
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-slate-300">Ingressos por Categoria</h2>
                  <div className="space-y-2">
                    {Object.entries(detalhe.metricas.ingressosPorCategoria)
                      .filter(([, count]) => count > 0)
                      .map(([categoria, count]) => (
                        <div key={categoria} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{categoria}</span>
                          <span className="font-semibold text-white">{count}</span>
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
