import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'

interface Ingresso {
  id: number
  codigo: string
  status: string
  criadoEm: string
  sessao: {
    id: number
    dataHora: string
    evento: { id: number; titulo: string; posterUrl: string | null; endereco: { cidade: string; estado: string } | null }
    assento: { fileira: string; numero: number } | null
  }
  reserva: {
    id: number
    itens: { categoria: string; precoCentavos: number }[]
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

function formatarPreco(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

export default function DetalheIngressoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ingresso, setIngresso] = useState<Ingresso | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const data = await api<Ingresso>(`/ingressos/${id}`)
        setIngresso(data)
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  async function cancelar() {
    if (!confirmado) {
      setConfirmado(true)
      return
    }
    setCancelando(true)
    try {
      await api(`/ingressos/${ingresso?.id}/cancelar`, { method: 'POST' })
      setIngresso((prev) => prev ? { ...prev, status: 'CANCELADO' } : null)
      setConfirmado(false)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao cancelar')
    } finally {
      setCancelando(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-60 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
      </div>
    )
  }

  if (erro) {
    return (
      <div>
        <p className="text-red-400">{erro}</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-sm text-[#00FF88]">
          ← Voltar
        </button>
      </div>
    )
  }

  if (!ingresso) return null

  const podeCancelar = ingresso.status === 'EMITIDO' || ingresso.status === 'PENDENTE'
  const evento = ingresso.sessao.evento

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <div className="flex items-start gap-4">
        {evento.posterUrl && (
          <img
            src={evento.posterUrl}
            alt={evento.titulo}
            className="hidden h-32 w-24 rounded-lg object-cover sm:block"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white">{evento.titulo}</h1>
          <p className="text-sm text-slate-400">{formatarData(ingresso.sessao.dataHora)}</p>
          {evento.endereco && (
            <p className="text-xs text-slate-500">
              {evento.endereco.cidade}/{evento.endereco.estado}
            </p>
          )}
        </div>
      </div>

      <Card>
        <div className="mb-4 text-center">
          <h2 className="mb-2 text-xs font-semibold text-slate-500">QR Code</h2>
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl border border-slate-700 bg-white p-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ingresso.codigo)}`}
              alt={`QR Code do ingresso ${ingresso.codigo}`}
              className="h-full w-full"
            />
          </div>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-[#00FF88]">{ingresso.codigo}</p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-xs font-semibold text-slate-500">Detalhes</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status</span>
            <StatusBadge status={ingresso.status} />
          </div>
          {ingresso.sessao.assento && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Assento</span>
              <span className="text-white">{ingresso.sessao.assento.fileira}{ingresso.sessao.assento.numero}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Categoria</span>
            <span className="text-white">{ingresso.reserva.itens[0]?.categoria}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Preço</span>
            <span className="text-white">{formatarPreco(ingresso.reserva.itens[0]?.precoCentavos ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Emitido em</span>
            <span className="text-white">{formatarData(ingresso.criadoEm)}</span>
          </div>
        </div>
      </Card>

      {podeCancelar && (
        <Card>
          {!confirmado ? (
            <p className="mb-3 text-sm text-slate-400">
              Tem certeza que deseja cancelar este ingresso? Esta ação não pode ser desfeita.
            </p>
          ) : (
            <p className="mb-3 text-sm font-semibold text-red-400">
              Confirme o cancelamento do ingresso.
            </p>
          )}
          <button
            onClick={cancelar}
            disabled={cancelando}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-40"
          >
            {cancelando ? 'Cancelando...' : confirmado ? 'Confirmar Cancelamento' : 'Cancelar Ingresso'}
          </button>
        </Card>
      )}
    </div>
  )
}
