import { useState } from 'react'
import { api } from '../../../api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

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

function formatarStatus(status: string): string {
  const labels: Record<string, string> = {
    APROVADO: 'Aprovado',
    PENDENTE_DOCUMENTACAO: 'Pendente Documentação',
    REJEITADO: 'Rejeitado',
  }
  return labels[status] ?? status
}

const CORES_RESULTADO: Record<string, string> = {
  APROVADO: 'border-emerald-500/60 bg-emerald-900/20 text-emerald-400',
  PENDENTE_DOCUMENTACAO: 'border-yellow-500/60 bg-yellow-900/20 text-yellow-400',
  REJEITADO: 'border-red-500/60 bg-red-900/20 text-red-400',
}

export default function ValidarPage() {
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [validando, setValidando] = useState(false)

  async function validar(e: React.FormEvent) {
    e.preventDefault()
    const codigoLimpo = codigo.trim()
    if (!codigoLimpo) return

    setValidando(true)
    setResultado(null)
    setErro(null)

    try {
      const res = await api<ResultadoValidacao>('/portaria/validar', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigoLimpo }),
      })
      setResultado(res)
      setCodigo('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao validar ingresso'
      setErro(msg)
    } finally {
      setValidando(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Validar Ingresso</h1>

      <form onSubmit={validar} className="flex gap-2">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código do ingresso"
          autoFocus
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#00FF88] focus:outline-none"
        />
        <Button type="submit" loading={validando} className="w-auto px-6 py-3 text-sm">
          Validar
        </Button>
      </form>

      {erro && (
        <Card className="border-red-500/60 bg-red-900/20">
          <p className="text-sm text-red-400">{erro}</p>
        </Card>
      )}

      {resultado && (
        <Card className={CORES_RESULTADO[resultado.status] ?? ''}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Resultado
              </span>
              <span className="text-sm font-bold">{formatarStatus(resultado.status)}</span>
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
          </div>
        </Card>
      )}
    </div>
  )
}
