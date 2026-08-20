import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import Input from '../../../components/ui/Input'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

interface EventoListItem {
  id: number
  titulo: string
  posterUrl: string | null
  criadoEm: string
  endereco: { cidade: string; estado: string } | null
  categorias: { nome: string; precoCentavos: number }[]
  sessoes: { id: number; dataHora: string }[]
}

interface BuscaParams {
  busca?: string
  cidade?: string
  estado?: string
  dataInicio?: string
  dataFim?: string
  precoMin?: number
  precoMax?: number
  page: number
}

interface Paginacao {
  eventos: EventoListItem[]
  total: number
  page: number
  limit: number
}

const UF = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function formatarPreco(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
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

function montarQuery(params: BuscaParams): string {
  const q = new URLSearchParams()
  if (params.busca) q.set('busca', params.busca)
  if (params.cidade) q.set('cidade', params.cidade)
  if (params.estado) q.set('estado', params.estado)
  if (params.dataInicio) q.set('dataInicio', params.dataInicio)
  if (params.dataFim) q.set('dataFim', params.dataFim)
  if (params.precoMin != null) q.set('precoMin', String(params.precoMin))
  if (params.precoMax != null) q.set('precoMax', String(params.precoMax))
  q.set('page', String(params.page))
  q.set('limit', '12')
  return q.toString()
}

export default function InicioPage() {
  const [eventos, setEventos] = useState<EventoListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const [busca, setBusca] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [page, setPage] = useState(1)

  useDocumentTitle('Explorar Eventos')

  const buscarEventos = useCallback(async (params: BuscaParams) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await api<Paginacao>(`/eventos/publicos?${montarQuery(params)}`)
      setEventos(data.eventos)
      setTotal(data.total)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao buscar eventos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    buscarEventos({ page })
  }, [page, buscarEventos])

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    buscarEventos({
      busca: busca || undefined,
      cidade: cidade || undefined,
      estado: estado || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      precoMin: precoMin ? Math.round(Number(precoMin) * 100) : undefined,
      precoMax: precoMax ? Math.round(Number(precoMax) * 100) : undefined,
      page: 1,
    })
  }

  function limparFiltros() {
    setBusca('')
    setCidade('')
    setEstado('')
    setDataInicio('')
    setDataFim('')
    setPrecoMin('')
    setPrecoMax('')
    setPage(1)
    buscarEventos({ page: 1 })
  }

  const temFiltros = busca || cidade || estado || dataInicio || dataFim || precoMin || precoMax
  const totalPaginas = Math.ceil(total / 12)

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Explorar Eventos</h1>

      <form onSubmit={handleBuscar} className="mb-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar eventos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#00FF88] px-4 py-2.5 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          Filtros
          {temFiltros && (
            <span className="rounded-full bg-[#00FF88]/20 px-1.5 py-0.5 text-xs text-[#00FF88]">
              Ativos
            </span>
          )}
        </button>

        {filtrosAbertos && (
          <Card className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Cidade</label>
                <input
                  type="text"
                  placeholder="São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-[#00FF88] focus:outline-none"
                >
                  <option value="">Todos</option>
                  {UF.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Data início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-[#00FF88] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Data fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-[#00FF88] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Preço mín (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={precoMin}
                  onChange={(e) => setPrecoMin(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Preço máx (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ilimitado"
                  value={precoMax}
                  onChange={(e) => setPrecoMax(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Limpar
              </button>
            </div>
          </Card>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : erro ? (
        <p className="text-red-400">{erro}</p>
      ) : eventos.length === 0 ? (
        <EmptyState
          titulo="Nenhum evento encontrado"
          descricao={temFiltros ? "Tente ajustar os filtros ou buscar por outros termos." : "Ainda não há eventos publicados."}
          ctaLabel={temFiltros ? "Limpar Filtros" : undefined}
          onCtaClick={temFiltros ? limparFiltros : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((ev) => (
              <Link key={ev.id} to={`/portal/cliente/evento/${ev.id}`}>
                <Card className="flex h-full flex-col">
                  {ev.posterUrl ? (
                    <img
                      src={ev.posterUrl}
                      alt={ev.titulo}
                      className="mb-3 h-40 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-slate-800 text-4xl text-slate-600">
                      &#9744;
                    </div>
                  )}
                  <h3 className="mb-1 truncate font-semibold text-white">{ev.titulo}</h3>
                  {ev.endereco && (
                    <p className="mb-2 text-xs text-slate-400">
                      {ev.endereco.cidade}/{ev.endereco.estado}
                    </p>
                  )}
                  <div className="mb-2 flex flex-wrap gap-1">
                    {ev.categorias.slice(0, 3).map((cat) => (
                      <span
                        key={cat.nome}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        {cat.nome} {formatarPreco(cat.precoCentavos)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-1">
                    {ev.sessoes.length > 0 ? (
                      <p className="text-xs text-[#00FF88]">
                        Próxima: {formatarData(ev.sessoes[0].dataHora)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Sem sessões</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-400">
                {page} / {totalPaginas}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                disabled={page === totalPaginas}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
