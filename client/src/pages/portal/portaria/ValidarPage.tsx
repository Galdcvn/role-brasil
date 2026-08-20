import { useState, useCallback, useEffect } from 'react'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import QRScanner from '../../../components/ui/QRScanner'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

interface IngressoInfo {
  id: number
  codigo: string
  categoria: string
  evento: string
  assento: string
  usuario: string
}

interface ResultadoValidacao {
  status: string
  ingresso: IngressoInfo
}

interface EventoPortaria {
  id: number
  titulo: string
}

const CARD_POR_STATUS: Record<string, string> = {
  APROVADO: 'border-emerald-500/60 bg-emerald-900/20',
  PENDENTE_DOCUMENTACAO: 'border-yellow-500/60 bg-yellow-900/20',
  REJEITADO: 'border-red-500/60 bg-red-900/20',
}

interface ErroInfo {
  mensagem: string
  icone: string
  cor: string
}

function classificarErro(msg: string): ErroInfo {
  if (msg.includes('já utilizado') || msg.includes('ja utilizado')) {
    return { mensagem: msg, icone: '🔄', cor: 'border-orange-500/60 bg-orange-900/20' }
  }
  if (msg.includes('outro evento') || msg.includes('evento errado')) {
    return { mensagem: msg, icone: '🎪', cor: 'border-amber-500/60 bg-amber-900/20' }
  }
  if (msg.includes('cancelado')) {
    return { mensagem: msg, icone: '🚫', cor: 'border-red-500/60 bg-red-900/20' }
  }
  if (msg.includes('não encontrado') || msg.includes('nao encontrado')) {
    return { mensagem: msg, icone: '❌', cor: 'border-red-500/60 bg-red-900/20' }
  }
  return { mensagem: msg, icone: '⚠️', cor: 'border-red-500/60 bg-red-900/20' }
}

export default function ValidarPage() {
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null)
  const [erro, setErro] = useState<ErroInfo | null>(null)
  const [validando, setValidando] = useState(false)
  const [scannerAberto, setScannerAberto] = useState(false)
  const [confirmacaoId, setConfirmacaoId] = useState<number | null>(null)
  const [rejeitacaoId, setRejeitacaoId] = useState<number | null>(null)
  const [confirmandoRejeicao, setConfirmandoRejeicao] = useState(false)

  const [eventos, setEventos] = useState<EventoPortaria[]>([])
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(null)

  useDocumentTitle('Validar Ingresso')

  useEffect(() => {
    api<EventoPortaria[]>('/eventos/publicos?limit=100')
      .then((res) => setEventos(res as unknown as EventoPortaria[]))
      .catch(() => setErro({ mensagem: 'Não foi possível carregar a lista de eventos.', icone: '⚠️', cor: 'border-amber-500/60 bg-amber-900/20' }))
  }, [])

  async function validarCodigo(codigoLimpo: string) {
    if (!codigoLimpo) {
      setErro({ mensagem: 'Digite ou escaneie um código de ingresso.', icone: '⚠️', cor: 'border-amber-500/60 bg-amber-900/20' })
      return
    }

    setValidando(true)
    setResultado(null)
    setErro(null)

    try {
      const body: { codigo: string; eventoId?: number } = { codigo: codigoLimpo }
      if (eventoSelecionadoId) body.eventoId = eventoSelecionadoId
      const res = await api<ResultadoValidacao>('/portaria/validar', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setResultado(res)
      setCodigo('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao validar ingresso'
      setErro(classificarErro(msg))
    } finally {
      setValidando(false)
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    await validarCodigo(codigo.trim())
  }

  const handleScan = useCallback((decodedText: string) => {
    setScannerAberto(false)
    setCodigo(decodedText)
    validarCodigo(decodedText)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAcaoComprovante(acao: 'confirmar' | 'rejeitar') {
    if (!resultado?.ingresso?.id) return
    if (acao === 'confirmar') setConfirmacaoId(resultado.ingresso.id)
    else setRejeitacaoId(resultado.ingresso.id)
    try {
      const res = await api<ResultadoValidacao>(
        `/portaria/comprovantes/${resultado.ingresso.id}/${acao}`,
        { method: 'POST' },
      )
      setResultado(res)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao processar ação'
      setErro(classificarErro(msg))
    } finally {
      setConfirmacaoId(null)
      setRejeitacaoId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Validar Ingresso</h1>

      {eventos.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Evento (recomendado)</label>
          <select
            value={eventoSelecionadoId ?? ''}
            onChange={(e) => setEventoSelecionadoId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white focus:border-[#00FF88] focus:outline-none"
          >
            <option value="">Todos os eventos</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.titulo}</option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código do ingresso"
          autoFocus
          aria-label="Código do ingresso"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#00FF88] focus:outline-none"
        />
        <Button type="submit" loading={validando} className="w-auto px-6 py-3 text-sm">
          Validar
        </Button>
      </form>

      <button
        onClick={() => setScannerAberto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-[#00FF88]/40 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
        </svg>
        Escanear QR Code
      </button>

      {scannerAberto && (
        <QRScanner onScan={handleScan} onClose={() => setScannerAberto(false)} />
      )}

      {erro && (
        <Card className={erro.cor}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{erro.icone}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Erro</p>
              <p className="mt-0.5 text-sm text-slate-300">{erro.mensagem}</p>
            </div>
          </div>
        </Card>
      )}

      {resultado && (
        <Card className={CARD_POR_STATUS[resultado.status] ?? ''}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Resultado
              </span>
              <StatusBadge status={resultado.status} />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Evento</span>
                <span className="font-medium">{resultado.ingresso.evento}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Assento</span>
                <span className="font-medium">{resultado.ingresso.assento}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Categoria</span>
                <span className="font-medium">{resultado.ingresso.categoria}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Usuário</span>
                <span className="font-medium">{resultado.ingresso.usuario}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Código</span>
                <span className="font-mono text-xs">{resultado.ingresso.codigo}</span>
              </div>
            </div>
            {resultado.status === 'PENDENTE_DOCUMENTACAO' && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleAcaoComprovante('confirmar')}
                  loading={confirmacaoId === resultado?.ingresso?.id}
                  className="flex-1 border-emerald-500/40 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                >
                  Confirmar
                </Button>
                <Button
                  onClick={() => setConfirmandoRejeicao(true)}
                  loading={rejeitacaoId === resultado?.ingresso?.id}
                  className="flex-1 border-red-500/40 bg-red-600/20 text-red-400 hover:bg-red-600/30"
                >
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
      {confirmandoRejeicao && (
        <ConfirmDialog
          titulo="Rejeitar comprovante"
          mensagem="O ingresso será recusado e o participante não terá acesso. Confirmar rejeição?"
          variante="perigo"
          confirmarLabel="Rejeitar"
          onConfirmar={() => { setConfirmandoRejeicao(false); handleAcaoComprovante('rejeitar') }}
          onCancelar={() => setConfirmandoRejeicao(false)}
        />
      )}
    </div>
  )
}
