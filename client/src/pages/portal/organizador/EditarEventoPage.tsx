import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../../api'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { useBeforeUnload } from '../../../hooks/useBeforeUnload'
import { useToast } from '../../../contexts/ToastContext'

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
  sessoes: Array<{ id: number; dataHora: string; status: string }>
}

const ESTADOS_UF = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function EditarEventoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [temReservas, setTemReservas] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [telefoneSuporte, setTelefoneSuporte] = useState('')
  const [emailSuporte, setEmailSuporte] = useState('')

  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [alterado, setAlterado] = useState(false)

  useDocumentTitle(titulo ? `Editar ${titulo}` : 'Editar Evento')
  useBeforeUnload(alterado)

  useEffect(() => {
    api<Evento>(`/eventos/${id}`)
      .then((ev) => {
        setTitulo(ev.titulo)
        setDescricao(ev.descricao ?? '')
        setPosterUrl(ev.posterUrl ?? '')
        setTelefoneSuporte(ev.telefoneSuporte ?? '')
        setEmailSuporte(ev.emailSuporte ?? '')
        setTemReservas(ev.sessoes.length > 0)
        if (ev.endereco) {
          setCep(ev.endereco.cep)
          setRua(ev.endereco.rua)
          setNumero(ev.endereco.numero?.toString() ?? '')
          setBairro(ev.endereco.bairro)
          setCidade(ev.endereco.cidade)
          setEstado(ev.endereco.estado)
        }
        setCategorias(ev.categorias.map((c) => ({ ...c })))
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [id])

  function atualizarCategoria(idx: number, campo: keyof Categoria, valor: string | number | boolean) {
    setAlterado(true)
    setCategorias((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)),
    )
  }

  function adicionarCategoria() {
    setCategorias((prev) => [...prev, { nome: 'MEIA', precoCentavos: 0, requerComprovante: false }])
  }

  function removerCategoria(idx: number) {
    setCategorias((prev) => prev.filter((_, i) => i !== idx))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const body: Record<string, unknown> = {}
      if (!temReservas) {
        body.titulo = titulo.trim()
        body.posterUrl = posterUrl.trim() || null
        body.telefoneSuporte = telefoneSuporte.trim() || null
        body.emailSuporte = emailSuporte.trim() || null
        body.endereco = rua.trim()
          ? { cep: cep.trim(), rua: rua.trim(), numero: numero ? Number(numero) : undefined, bairro: bairro.trim(), cidade: cidade.trim(), estado }
          : undefined
        body.categorias = categorias.map((c) => ({
          nome: c.nome,
          precoCentavos: c.precoCentavos,
          requerComprovante: c.requerComprovante,
        }))
      }
      body.descricao = descricao.trim() || null
      await api(`/eventos/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
      toast.success('Evento salvo com sucesso')
      navigate(`/portal/organizador/evento/${id}`)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-800" />
      </div>
    )
  }

  if (erro && !titulo) {
    return (
      <div>
        <p className="text-red-400">{erro}</p>
        <div className="mt-3 flex gap-3">
          <button onClick={() => { setErro(null); window.location.reload() }} className="text-sm text-[#00FF88] hover:underline">
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
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold">Editar Evento</h1>
      </div>

      {temReservas && (
        <div className="mb-4 rounded-lg bg-yellow-900/30 px-3 py-2 text-xs text-yellow-400">
          Este evento já possui reservas. Somente a descrição pode ser editada.
        </div>
      )}

      <form onSubmit={enviar} className="space-y-4">
        {!temReservas && (
          <>
            <Input
              icon={null}
              placeholder="Título do evento"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
            <Input
              icon={null}
              placeholder="URL do poster"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
            />
            <Input
              icon={null}
              placeholder="Telefone de suporte"
              value={telefoneSuporte}
              onChange={(e) => setTelefoneSuporte(e.target.value)}
            />
            <Input
              icon={null}
              placeholder="Email de suporte"
              value={emailSuporte}
              onChange={(e) => setEmailSuporte(e.target.value)}
            />
          </>
        )}

        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={8}
          className="w-full min-h-[200px] resize-y rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 transition-colors focus:border-[#00FF88] focus:outline-none"
        />

        {!temReservas && (
          <>
            <div className="border-t border-slate-800 pt-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Endereço</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input icon={null} placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} />
                <Input icon={null} placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} className="col-span-2" />
                <Input icon={null} placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
                <Input icon={null} placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                <Input icon={null} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3 text-sm text-white focus:border-[#00FF88] focus:outline-none"
                >
                  <option value="">UF</option>
                  {ESTADOS_UF.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Categorias</h2>
              <div className="space-y-3">
                {categorias.map((cat, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2">
                    <select
                      value={cat.nome}
                      onChange={(e) => atualizarCategoria(idx, 'nome', e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3 text-sm text-white focus:border-[#00FF88] focus:outline-none"
                    >
                      <option value="INTEIRA">Inteira</option>
                      <option value="MEIA">Meia</option>
                      <option value="GRATUIDADE">Gratuidade</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Preço (R$)"
                      value={cat.precoCentavos === 0 ? '' : (cat.precoCentavos / 100).toString()}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.round(Number(e.target.value) * 100)
                        atualizarCategoria(idx, 'precoCentavos', val)
                      }}
                      min={0}
                      step={0.5}
                      className="w-28 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3 text-sm text-white focus:border-[#00FF88] focus:outline-none"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={cat.requerComprovante}
                        onChange={(e) => atualizarCategoria(idx, 'requerComprovante', e.target.checked)}
                        className="accent-[#00FF88]"
                      />
                      Comprovante
                    </label>
                    {categorias.length > 1 && (
                      <button type="button" onClick={() => removerCategoria(idx)} className="text-xs text-red-400 hover:text-red-300">
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={adicionarCategoria} className="mt-3 text-sm text-[#00FF88] hover:underline">
                + Adicionar categoria
              </button>
            </div>
          </>
        )}

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <Button type="submit" loading={enviando}>
          Salvar Alterações
        </Button>
      </form>
    </div>
  )
}
