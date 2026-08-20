import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { useToast } from '../../../contexts/ToastContext'

interface Sessao {
  id: number
  dataHora: string
  status: string
}

interface Categoria {
  nome: string
  precoCentavos: number
  requerComprovante: boolean
}

interface Endereco {
  rua: string
  numero: number | null
  bairro: string
  cidade: string
  estado: string
  cep: string
}

interface Metricas {
  reservasTotais: number
  valorArrecadado: number
  reservasPorSessao: Array<{ sessaoId: number; dataHora: string; total: number }>
  valorArrecadadoPorSessao: Array<{ sessaoId: number; dataHora: string; total: number }>
}

interface Evento {
  id: number
  titulo: string
  descricao: string | null
  posterUrl: string | null
  telefoneSuporte: string | null
  emailSuporte: string | null
  status: string
  criadoEm: string
  endereco: Endereco | null
  categorias: Categoria[]
  sessoes: Sessao[]
  metricas: Metricas
}

function formatarCentavos(centavos: number): string {
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

export default function DetalheEventoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [acaoLoading, setAcaoLoading] = useState<string | null>(null)
  const [novaSessaoData, setNovaSessaoData] = useState('')
  const [sessaoErro, setSessaoErro] = useState<string | null>(null)
  const [criandoSessao, setCriandoSessao] = useState(false)
  const [confirmacao, setConfirmacao] = useState<{ titulo: string; mensagem: string; variante: 'perigo' | 'padrao'; onConfirmar: () => void; loading?: boolean } | null>(null)

  useDocumentTitle(evento?.titulo ?? 'Carregando...')

  useEffect(() => {
    api<Evento>(`/eventos/${id}`)
      .then(setEvento)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [id])

  async function executarAcao(endpoint: string, method = 'POST') {
    setAcaoLoading(method === 'DELETE' ? 'excluir' : method === 'POST' && endpoint.includes('publicar') ? 'publicar' : 'cancelar')
    try {
      await api<Evento>(endpoint, { method })
      if (method === 'DELETE') {
        navigate('/portal/organizador/eventos')
        return
      }
      const atualizado = await api<Evento>(`/eventos/${id}`)
      setEvento(atualizado)
      toast.success('Ação realizada com sucesso')
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setAcaoLoading(null)
    }
  }

  async function criarSessao(e: React.FormEvent) {
    e.preventDefault()
    if (!novaSessaoData) return
    if (new Date(novaSessaoData) <= new Date()) {
      setSessaoErro('A data e hora devem ser no futuro.')
      return
    }
    setSessaoErro(null)
    setCriandoSessao(true)
    try {
      const offset = -new Date().getTimezoneOffset()
      const sign = offset >= 0 ? '+' : '-'
      const abs = Math.abs(offset)
      const tz = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
      await api(`/eventos/${id}/sessoes`, {
        method: 'POST',
        body: JSON.stringify({
          dataHora: `${novaSessaoData}:00${tz}`,
          fileiras: 5,
          assentosPorFileira: 20,
        }),
      })
      setNovaSessaoData('')
      const atualizado = await api<Evento>(`/eventos/${id}`)
      setEvento(atualizado)
      toast.success('Sessão criada com sucesso')
    } catch (e: unknown) {
      setSessaoErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setCriandoSessao(false)
    }
  }

  async function cancelarSessao(sessaoId: number) {
    setConfirmacao({
      titulo: 'Cancelar sessão',
      mensagem: 'Tem certeza que deseja cancelar esta sessão? Esta ação não pode ser desfeita.',
      variante: 'perigo',
      loading: false,
      onConfirmar: async () => {
        setConfirmacao((prev) => (prev ? { ...prev, loading: true } : null))
        try {
          await api(`/sessoes/${sessaoId}/cancelar`, { method: 'POST' })
          const atualizado = await api<Evento>(`/eventos/${id}`)
          setEvento(atualizado)
          toast.success('Sessão cancelada')
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : 'Erro ao cancelar sessão')
        } finally {
          setConfirmacao(null)
        }
      },
    })
  }

  function confirmarAcao(titulo: string, mensagem: string, endpoint: string, method: string, variante: 'perigo' | 'padrao' = 'perigo') {
    setConfirmacao({
      titulo,
      mensagem,
      variante,
      onConfirmar: async () => {
        setConfirmacao(null)
        await executarAcao(endpoint, method)
      },
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
      </div>
    )
  }

  if (erro || !evento) {
    return (
      <div>
        <p className="text-red-400">{erro ?? 'Evento não encontrado'}</p>
        <div className="mt-3 flex gap-3">
          <button onClick={() => { setErro(null); setLoading(true); api<Evento>(`/eventos/${id}`).then(setEvento).catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro')).finally(() => setLoading(false)) }} className="text-sm text-[#00FF88] hover:underline">
            Tentar novamente
          </button>
          <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {evento.posterUrl && (
          <img
            src={evento.posterUrl}
            alt={evento.titulo}
            className="hidden h-32 w-24 rounded object-cover sm:block"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{evento.titulo}</h1>
            <StatusBadge status={evento.status} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Criado em {formatarData(evento.criadoEm)}
          </p>
        </div>
        <Link
          to={`/portal/organizador/evento/${id}/editar`}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
        >
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-400">Reservas</p>
          <p className="text-2xl font-bold text-white">{evento.metricas.reservasTotais}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Receita</p>
          <p className="text-2xl font-bold text-[#00FF88]">
            {formatarCentavos(evento.metricas.valorArrecadado)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Sessões</p>
          <p className="text-2xl font-bold text-white">{evento.sessoes.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Categorias</p>
          <p className="text-2xl font-bold text-white">{evento.categorias.length}</p>
        </Card>
      </div>

      {evento.descricao && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Descrição</h2>
          <p className="text-sm text-slate-400">{evento.descricao}</p>
        </Card>
      )}

      {evento.endereco && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Endereço</h2>
          <p className="text-sm text-slate-400">
            {evento.endereco.rua}
            {evento.endereco.numero ? `, ${evento.endereco.numero}` : ''} —{' '}
            {evento.endereco.bairro}, {evento.endereco.cidade}/{evento.endereco.estado}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Categorias</h2>
        <div className="space-y-2">
          {evento.categorias.map((cat) => (
            <div key={cat.nome} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{cat.nome}</span>
              <span className="font-semibold text-white">{formatarCentavos(cat.precoCentavos)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Sessões</h2>
        </div>
        {evento.sessoes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma sessão criada.</p>
        ) : (
          <div className="space-y-2">
            {evento.sessoes.map((s) => {
              const metrica = evento.metricas.reservasPorSessao.find(
                (r) => r.sessaoId === s.id,
              )
              const receita = evento.metricas.valorArrecadadoPorSessao.find(
                (r) => r.sessaoId === s.id,
              )
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-white">{formatarData(s.dataHora)}</p>
                    <p className="text-xs text-slate-400">
                      {metrica?.total ?? 0} reservas — {formatarCentavos(receita?.total ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    {s.status === 'ATIVA' && (
                      <button
                        onClick={() => cancelarSessao(s.id)}
                        disabled={acaoLoading !== null}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <form onSubmit={criarSessao} className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={novaSessaoData}
              onChange={(e) => setNovaSessaoData(e.target.value)}
              disabled={acaoLoading !== null}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-[#00FF88] focus:outline-none disabled:opacity-40"
            />
            <Button type="submit" loading={criandoSessao} disabled={acaoLoading !== null} className="w-auto px-4 py-2 text-xs">
              Adicionar
            </Button>
          </div>
        </form>
        {sessaoErro && <p className="mt-2 text-xs text-red-400">{sessaoErro}</p>}
      </Card>

      <div className="flex flex-wrap gap-2">
        {evento.status === 'RASCUNHO' && (
          <Button
            onClick={() => {
              if (evento.sessoes.length === 0) {
                setErro('Adicione pelo menos uma sessão antes de publicar.')
                return
              }
              confirmarAcao(
                'Publicar evento',
                'O evento ficará visível para os clientes. Deseja continuar?',
                `/eventos/${id}/publicar`,
                'POST',
                'padrao',
              )
            }}
            loading={acaoLoading === 'publicar'}
            disabled={acaoLoading !== null}
            className="w-auto px-6 py-2 text-xs"
          >
            Publicar
          </Button>
        )}
        {evento.status === 'PUBLICADO' && (
          <Button
            onClick={() => confirmarAcao(
              'Cancelar evento',
              'O evento será cancelado e ficará inacessível. Sessões ativas serão canceladas. Deseja continuar?',
              `/eventos/${id}/cancelar`,
              'POST',
            )}
            loading={acaoLoading === 'cancelar'}
            disabled={acaoLoading !== null}
            className="w-auto bg-red-600 px-6 py-2 text-xs shadow-red-600/20 hover:bg-red-500"
          >
            Cancelar Evento
          </Button>
        )}
        {evento.status === 'RASCUNHO' && evento.metricas.reservasTotais === 0 && (
          <Button
            onClick={() => confirmarAcao(
              'Excluir evento',
              'Esta ação é irreversível. O evento e todas as sessões serão removidos permanentemente.',
              `/eventos/${id}`,
              'DELETE',
            )}
            loading={acaoLoading === 'excluir'}
            disabled={acaoLoading !== null}
            className="w-auto bg-red-600 px-6 py-2 text-xs shadow-red-600/20 hover:bg-red-500"
          >
            Excluir
          </Button>
        )}
      </div>

      {confirmacao && (
        <ConfirmDialog
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          variante={confirmacao.variante}
          loading={confirmacao.loading}
          confirmarLabel={confirmacao.variante === 'perigo' ? 'Sim, excluir' : 'Confirmar'}
          onConfirmar={confirmacao.onConfirmar}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </div>
  )
}
