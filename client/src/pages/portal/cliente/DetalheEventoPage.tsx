import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface Endereco {
  rua: string
  numero: number | null
  bairro: string
  cidade: string
  estado: string
  cep: string
}

interface Categoria {
  nome: string
  precoCentavos: number
}

interface Sessao {
  id: number
  dataHora: string
  vagasDisponiveis: number
}

interface Evento {
  id: number
  titulo: string
  descricao: string | null
  posterUrl: string | null
  telefoneSuporte: string | null
  emailSuporte: string | null
  endereco: Endereco | null
  categorias: Categoria[]
  sessoes: Sessao[]
}

interface FileiraAssentos {
  fileira: string
  assentos: { id: number; fileira: string; numero: number; status: string }[]
}

interface ItemAssento {
  assentoSessaoId: number
  categoria: string
  fileira: string
  numero: number
}

interface Reserva {
  id: number
  status: string
  subtotalCentavos: number
  expiraEm: string
  itens: { id: number; assentoSessaoId: number; categoria: string; precoCentavos: number }[]
  sessao: { id: number; dataHora: string; evento: { id: number; titulo: string } }
}

interface Mensagem {
  id: number
  eventoId: number
  remetenteId: number
  conteudo: string
  lida: boolean
  criadoEm: string
  remetente: { id: number; nome: string }
}

type EtapaCompra = 'info' | 'assentos' | 'reserva' | 'confirmacao'

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

function TimerReserva({ expiraEm, onExpirou }: { expiraEm: string; onExpirou: () => void }) {
  const [restante, setRestante] = useState('')
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function atualizar() {
      const diff = new Date(expiraEm).getTime() - Date.now()
      if (diff <= 0) {
        setRestante('00:00')
        onExpirou()
        return
      }
      const min = Math.floor(diff / 60000)
      const seg = Math.floor((diff % 60000) / 1000)
      setRestante(`${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`)
    }
    atualizar()
    intervaloRef.current = setInterval(atualizar, 1000)
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current) }
  }, [expiraEm, onExpirou])

  return (
    <span className={`font-mono text-lg font-bold ${restante === '00:00' ? 'text-red-400' : 'text-yellow-400'}`}>
      {restante}
    </span>
  )
}

export default function DetalheEventoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [favoritado, setFavoritado] = useState(false)

  const [etapa, setEtapa] = useState<EtapaCompra>('info')
  const [sessaoId, setSessaoId] = useState<number | null>(null)
  const [assentos, setAssentos] = useState<FileiraAssentos[]>([])
  const [itensSelecionados, setItensSelecionados] = useState<ItemAssento[]>([])
  const [loadingAssentos, setLoadingAssentos] = useState(false)

  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTAO'>('PIX')
  const [cartao, setCartao] = useState({ nome: '', numero: '', validade: '', cvv: '' })
  const [pagamentoLoading, setPagamentoLoading] = useState(false)
  const [pagamentoErro, setPagamentoErro] = useState<string | null>(null)

  const [ingressos, setIngressos] = useState<{ id: number; codigo: string }[]>([])

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [mensagemTexto, setMensagemTexto] = useState('')
  const [chatAberto, setChatAberto] = useState(false)
  const [temIngresso, setTemIngresso] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const carregarEvento = useCallback(async () => {
    try {
      const data = await api<Evento>(`/eventos/publicos/${id}`)
      setEvento(data)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { carregarEvento() }, [carregarEvento])

  useEffect(() => {
    api<number[]>(`/favoritos`).then((ids) => {
      setFavoritado(ids.includes(Number(id)))
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    api<{ id: number; reserva: { sessao: { evento: { id: number } } } }[]>('/ingressos').then((lista) => {
      setTemIngresso(lista.some((ing) => ing.reserva.sessao.evento.id === Number(id)))
    }).catch(() => {})
  }, [id])

  async function toggleFavorito() {
    try {
      const res = await api<{ favoritado: boolean }>(`/favoritos/${id}`, { method: 'POST' })
      setFavoritado(res.favoritado)
    } catch {}
  }

  async function iniciarCompra(sessao: Sessao) {
    setSessaoId(sessao.id)
    setItensSelecionados([])
    setLoadingAssentos(true)
    setEtapa('assentos')
    try {
      const data = await api<FileiraAssentos[]>(`/sessoes/${sessao.id}/assentos`)
      setAssentos(data)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar assentos')
      setEtapa('info')
    } finally {
      setLoadingAssentos(false)
    }
  }

  function toggleAssento(assento: { id: number; fileira: string; numero: number }) {
    setItensSelecionados((prev) => {
      const idx = prev.findIndex((i) => i.assentoSessaoId === assento.id)
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx)
      }
      if (prev.length >= 10) return prev
      return [...prev, { assentoSessaoId: assento.id, categoria: 'INTEIRA', fileira: assento.fileira, numero: assento.numero }]
    })
  }

  function atualizarCategoria(assentoSessaoId: number, categoria: string) {
    setItensSelecionados((prev) =>
      prev.map((i) => i.assentoSessaoId === assentoSessaoId ? { ...i, categoria } : i),
    )
  }

  async function criarReserva() {
    if (!sessaoId || itensSelecionados.length === 0) return
    try {
      const res = await api<Reserva>('/reservas', {
        method: 'POST',
        body: JSON.stringify({
          sessaoId,
          itens: itensSelecionados.map((i) => ({
            assentoSessaoId: i.assentoSessaoId,
            categoria: i.categoria,
          })),
        }),
      })
      setReserva(res)
      setEtapa('reserva')
      setPagamentoErro(null)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar reserva')
    }
  }

  async function pagar() {
    if (!reserva) return
    setPagamentoLoading(true)
    setPagamentoErro(null)
    try {
      const body: Record<string, unknown> = { reservaId: reserva.id, tipo: metodoPagamento }
      if (metodoPagamento === 'CARTAO') {
        body.cartao = cartao
      }
      const res = await api<{ status: string; ingressos?: { id: number; codigo: string }[] }>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (res.status === 'RECUSADO') {
        setPagamentoErro('Pagamento recusado. Verifique os dados do cartão.')
        return
      }
      setIngressos(res.ingressos ?? [])
      setEtapa('confirmacao')
    } catch (e: unknown) {
      setPagamentoErro(e instanceof Error ? e.message : 'Erro no pagamento')
    } finally {
      setPagamentoLoading(false)
    }
  }

  function handleExpirou() {
    setReserva(null)
    setEtapa('info')
    setErro('Reserva expirada. Selecione os assentos novamente.')
  }

  const carregarMensagens = useCallback(async () => {
    if (!id) return
    try {
      const data = await api<Mensagem[]>(`/eventos/${id}/mensagens`)
      setMensagens(data)
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight
      }
    } catch {}
  }, [id])

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!mensagemTexto.trim() || !id) return
    try {
      const msg = await api<Mensagem>(`/eventos/${id}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ conteudo: mensagemTexto.trim() }),
      })
      setMensagens((prev) => [...prev, msg])
      setMensagemTexto('')
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight
      }
    } catch {}
  }

  useEffect(() => {
    if (chatAberto && temIngresso) {
      carregarMensagens()
      const intervalo = setInterval(carregarMensagens, 10000)
      return () => clearInterval(intervalo)
    }
  }, [chatAberto, temIngresso, carregarMensagens])

  function calcularSubtotal(): number {
    if (!reserva) return 0
    return reserva.itens.reduce((acc, item) => acc + item.precoCentavos, 0)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-60 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-800" />
      </div>
    )
  }

  if (erro && !evento) {
    return (
      <div>
        <p className="text-red-400">{erro ?? 'Evento não encontrado'}</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-sm text-[#00FF88]">
          ← Voltar
        </button>
      </div>
    )
  }

  if (!evento) return null

  const sessaoSelecionada = evento.sessoes.find((s) => s.id === sessaoId)

  return (
    <div className="space-y-6">
      {erro && (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{erro}</p>
      )}

      <div className="flex items-start gap-4">
        {evento.posterUrl && (
          <img
            src={evento.posterUrl}
            alt={evento.titulo}
            className="hidden h-40 w-28 rounded-lg object-cover sm:block"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{evento.titulo}</h1>
            <button
              onClick={toggleFavorito}
              className="shrink-0 p-1 transition-colors"
              aria-label={favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill={favoritado ? '#00FF88' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-6 w-6 ${favoritado ? 'text-[#00FF88]' : 'text-slate-400'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {evento.descricao && (
        <Card>
          <p className="text-sm text-slate-400">{evento.descricao}</p>
        </Card>
      )}

      {evento.endereco && (
        <Card>
          <h2 className="mb-1 text-xs font-semibold text-slate-500">Endereço</h2>
          <p className="text-sm text-slate-300">
            {evento.endereco.rua}
            {evento.endereco.numero ? `, ${evento.endereco.numero}` : ''} —{' '}
            {evento.endereco.bairro}, {evento.endereco.cidade}/{evento.endereco.estado}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-xs font-semibold text-slate-500">Categorias</h2>
        <div className="space-y-1.5">
          {evento.categorias.map((cat) => (
            <div key={cat.nome} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{cat.nome}</span>
              <span className="font-semibold text-white">{formatarPreco(cat.precoCentavos)}</span>
            </div>
          ))}
        </div>
      </Card>

      {etapa === 'info' && (
        <Card>
          <h2 className="mb-3 text-xs font-semibold text-slate-500">Sessões</h2>
          {evento.sessoes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma sessão disponível.</p>
          ) : (
            <div className="space-y-2">
              {evento.sessoes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm text-white">{formatarData(s.dataHora)}</p>
                    <p className="text-xs text-slate-400">
                      {s.vagasDisponiveis} vaga(s) disponível(is)
                    </p>
                  </div>
                  <button
                    onClick={() => iniciarCompra(s)}
                    disabled={s.vagasDisponiveis === 0}
                    className="rounded-lg bg-[#00FF88] px-4 py-1.5 text-xs font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Comprar
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {etapa === 'assentos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Selecionar Assentos</h2>
              {sessaoSelecionada && (
                <p className="text-xs text-slate-400">{formatarData(sessaoSelecionada.dataHora)}</p>
              )}
            </div>
            <button
              onClick={() => { setEtapa('info'); setSessaoId(null) }}
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Voltar
            </button>
          </div>

          {loadingAssentos ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {assentos.map((fileira) => (
                  <div key={fileira.fileira} className="flex items-center gap-1.5">
                    <span className="w-6 text-center text-xs font-semibold text-slate-500">{fileira.fileira}</span>
                    <div className="flex flex-wrap gap-1">
                      {fileira.assentos.map((assento) => {
                        const selecionado = itensSelecionados.some((i) => i.assentoSessaoId === assento.id)
                        const indisponivel = assento.status !== 'DISPONIVEL'
                        return (
                          <button
                            key={assento.id}
                            onClick={() => !indisponivel && toggleAssento(assento)}
                            disabled={indisponivel}
                            className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors ${
                              indisponivel
                                ? 'cursor-not-allowed bg-slate-800 text-slate-600'
                                : selecionado
                                  ? 'bg-[#00FF88] text-slate-950'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {assento.numero}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-slate-700" /> Disponível
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-[#00FF88]" /> Selecionado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-slate-800" /> Indisponível
                </span>
              </div>

              {itensSelecionados.length > 0 && (
                <Card>
                  <h3 className="mb-2 text-xs font-semibold text-slate-500">Assentos Selecionados</h3>
                  <div className="space-y-2">
                    {itensSelecionados.map((item) => (
                      <div key={item.assentoSessaoId} className="flex items-center justify-between">
                        <span className="text-sm text-white">
                          {item.fileira}{item.numero}
                        </span>
                        <select
                          value={item.categoria}
                          onChange={(e) => atualizarCategoria(item.assentoSessaoId, e.target.value)}
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:border-[#00FF88] focus:outline-none"
                        >
                          <option value="INTEIRA">Inteira</option>
                          <option value="MEIA">Meia</option>
                          <option value="GRATUIDADE">Gratuidade</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <Button onClick={criarReserva} className="w-auto px-6 py-2.5 text-xs">
                      Reservar ({itensSelecionados.length})
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {etapa === 'reserva' && reserva && (
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">Reserva</h2>
              <TimerReserva expiraEm={reserva.expiraEm} onExpirou={handleExpirou} />
            </div>
            <div className="space-y-1.5">
              {reserva.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{item.categoria}</span>
                  <span className="text-white">{formatarPreco(item.precoCentavos)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-slate-800 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Subtotal</span>
                <span className="text-lg font-bold text-[#00FF88]">{formatarPreco(calcularSubtotal())}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-xs font-semibold text-slate-500">Método de Pagamento</h3>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setMetodoPagamento('PIX')}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  metodoPagamento === 'PIX'
                    ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                PIX
              </button>
              <button
                onClick={() => setMetodoPagamento('CARTAO')}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  metodoPagamento === 'CARTAO'
                    ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                Cartão
              </button>
            </div>

            {metodoPagamento === 'CARTAO' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome no cartão"
                  value={cartao.nome}
                  onChange={(e) => setCartao((c) => ({ ...c, nome: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Número do cartão"
                  value={cartao.numero}
                  onChange={(e) => setCartao((c) => ({ ...c, numero: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Validade (MM/AA)"
                    value={cartao.validade}
                    onChange={(e) => setCartao((c) => ({ ...c, validade: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={cartao.cvv}
                    onChange={(e) => setCartao((c) => ({ ...c, cvv: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {metodoPagamento === 'PIX' && (
              <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                <p className="mb-2 text-sm text-slate-400">Pagamento via PIX</p>
                <p className="text-xs text-slate-500">Aprovação instantânea após confirmação.</p>
              </div>
            )}

            {pagamentoErro && (
              <p className="mt-3 text-sm text-red-400">{pagamentoErro}</p>
            )}

            <div className="mt-4">
              <Button onClick={pagar} loading={pagamentoLoading} className="w-auto px-6 py-2.5 text-xs">
                Pagar {formatarPreco(calcularSubtotal())}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {etapa === 'confirmacao' && (
        <div className="space-y-4">
          <Card className="text-center">
            <div className="mb-3 text-4xl">✅</div>
            <h2 className="mb-1 text-lg font-bold text-white">Ingressos Emitidos!</h2>
            <p className="mb-4 text-sm text-slate-400">Seus ingressos foram confirmados com sucesso.</p>
            <div className="space-y-2">
              {ingressos.map((ing) => (
                <div key={ing.id} className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <p className="font-mono text-sm text-[#00FF88]">{ing.codigo}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/portal/cliente/ingressos')}
              className="mt-4 text-sm font-semibold text-[#00FF88] hover:underline"
            >
              Ver Meus Ingressos →
            </button>
          </Card>
        </div>
      )}

      {temIngresso && etapa === 'info' && (
        <Card>
          <button
            onClick={() => { setChatAberto(!chatAberto); if (!chatAberto) carregarMensagens() }}
            className="flex w-full items-center justify-between"
          >
            <h2 className="text-sm font-semibold text-slate-300">Chat do Evento</h2>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-5 w-5 text-slate-400 transition-transform ${chatAberto ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {chatAberto && (
            <div className="mt-3">
              <div ref={chatRef} className="mb-3 max-h-60 space-y-2 overflow-y-auto rounded-lg bg-slate-800/50 p-3">
                {mensagens.length === 0 ? (
                  <p className="text-center text-xs text-slate-500">Nenhuma mensagem ainda.</p>
                ) : (
                  mensagens.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-semibold text-slate-300">{msg.remetente.nome}: </span>
                      <span className="text-slate-400">{msg.conteudo}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={enviarMensagem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={mensagemTexto}
                  onChange={(e) => setMensagemTexto(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!mensagemTexto.trim()}
                  className="rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                >
                  Enviar
                </button>
              </form>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
