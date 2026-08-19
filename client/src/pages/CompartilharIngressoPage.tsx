import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'

interface IngressoPublico {
  codigo: string
  status: string
  categoria: string
  criadoEm: string
  qrDataUrl: string
  assento: { fileira: string; numero: number } | null
  reserva: {
    sessao: {
      dataHora: string
      evento: {
        titulo: string
        posterUrl: string | null
        endereco: { cidade: string; estado: string } | null
      }
    }
    itens: { categoria: string; precoCentavos: number }[]
  }
}

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

export default function CompartilharIngressoPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const [ingresso, setIngresso] = useState<IngressoPublico | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!codigo) return
    api<IngressoPublico>(`/ingressos/publico/${codigo}`)
      .then(setIngresso)
      .catch((e: unknown) => {
        setErro(e instanceof Error ? e.message : 'Ingresso não encontrado')
      })
      .finally(() => setLoading(false))
  }, [codigo])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-slate-800" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
        </div>
      </div>
    )
  }

  if (erro || !ingresso) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="mx-auto max-w-md">
          <Card>
            <div className="text-center">
              <p className="text-4xl">🎫</p>
              <h1 className="mt-2 text-lg font-bold text-white">Ingresso não encontrado</h1>
              <p className="mt-1 text-sm text-slate-400">{erro ?? 'Código inválido ou expirado.'}</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const evento = ingresso.reserva.sessao.evento
  const item = ingresso.reserva.itens[0]

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="mx-auto max-w-md space-y-4">
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
            <p className="text-sm text-slate-400">{formatarData(ingresso.reserva.sessao.dataHora)}</p>
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
                src={ingresso.qrDataUrl}
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
            {ingresso.assento && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assento</span>
                <span className="text-white">{ingresso.assento.fileira}{ingresso.assento.numero}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Categoria</span>
              <span className="text-white">{item?.categoria ?? ingresso.categoria}</span>
            </div>
            {item && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Preço</span>
                <span className="text-white">{formatarPreco(item.precoCentavos)}</span>
              </div>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600">
          Compartilhado via Rolê Brasil
        </p>
      </div>
    </div>
  )
}
