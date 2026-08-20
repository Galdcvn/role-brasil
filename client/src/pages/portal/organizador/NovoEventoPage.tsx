import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../api'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { useBeforeUnload } from '../../../hooks/useBeforeUnload'

interface ResultadoTmdb {
  id: number
  titulo: string
  descricao: string
  posterUrl: string
  ano: number
}

interface CategoriaForm {
  nome: string
  precoCentavos: number
  requerComprovante: boolean
}

const ESTADOS_UF = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function NovoEventoPage() {
  const navigate = useNavigate()
  useDocumentTitle('Criar Evento')

  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ResultadoTmdb[]>([])
  const [buscando, setBuscando] = useState(false)
  const [selecionado, setSelecionado] = useState<ResultadoTmdb | null>(null)

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

  const [categorias, setCategorias] = useState<CategoriaForm[]>([
    { nome: 'INTEIRA', precoCentavos: 0, requerComprovante: false },
  ])

  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const temAlteracoes = titulo.trim() !== '' || descricao.trim() !== '' || categorias.length > 1 || categorias[0].precoCentavos > 0
  useBeforeUnload(temAlteracoes)

  async function buscarTmdb(e: React.FormEvent) {
    e.preventDefault()
    if (!busca.trim()) return
    setBuscando(true)
    try {
      const res = await api<ResultadoTmdb[]>(`/catalog/buscar?q=${encodeURIComponent(busca)}`)
      setResultados(res)
    } catch {
      setErro('Não foi possível buscar filmes. Tente novamente.')
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }

  function selecionarFilme(filme: ResultadoTmdb) {
    setSelecionado(filme)
    setTitulo(filme.titulo)
    setDescricao(filme.descricao)
    setPosterUrl(filme.posterUrl)
    setResultados([])
    setBusca('')
  }

  function atualizarCategoria(idx: number, campo: keyof CategoriaForm, valor: string | number | boolean) {
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
    if (!titulo.trim()) {
      setErro('Título é obrigatório.')
      return
    }
    if (categorias.length === 0) {
      setErro('Adicione pelo menos uma categoria.')
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      const body = {
        ...(selecionado ? { tmdbId: selecionado.id } : {}),
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        posterUrl: posterUrl.trim() || undefined,
        telefoneSuporte: telefoneSuporte.trim() || undefined,
        emailSuporte: emailSuporte.trim() || undefined,
        endereco:
          rua.trim()
            ? {
                cep: cep.trim(),
                rua: rua.trim(),
                numero: numero ? Number(numero) : undefined,
                bairro: bairro.trim(),
                cidade: cidade.trim(),
                estado,
              }
            : undefined,
        categorias: categorias.map((c) => ({
          nome: c.nome,
          precoCentavos: c.precoCentavos,
          requerComprovante: c.requerComprovante,
        })),
      }
      const criado = await api<{ id: number }>('/eventos', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      navigate(`/portal/organizador/evento/${criado.id}`)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold">Criar Evento</h1>
      </div>

      <form onSubmit={buscarTmdb} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Buscar filme no TMDb..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
        />
        <Button type="submit" className="w-auto px-4 py-2 text-xs" disabled={!busca.trim()}>
          {buscando ? '...' : 'Buscar'}
        </Button>
      </form>

      {resultados.length > 0 && (
        <div className="mb-6 space-y-2">
          {resultados.map((r) => (
            <button
              key={r.id}
              onClick={() => selecionarFilme(r)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-left transition-colors hover:border-[#00FF88]/50"
            >
              {r.posterUrl && (
                <img src={r.posterUrl} alt={r.titulo} className="h-16 w-12 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{r.titulo}</p>
                <p className="truncate text-xs text-slate-400">{r.ano}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={enviar} className="space-y-4">
        {selecionado && (
          <div className="flex items-center gap-2 rounded-lg bg-[#00FF88]/5 px-3 py-2 text-xs text-[#00FF88]">
            <span>Filme selecionado: {selecionado.titulo}</span>
            <button type="button" onClick={() => { setSelecionado(null); setTitulo(''); setDescricao(''); setPosterUrl('') }} className="ml-auto text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        <Input
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" /></svg>}
          placeholder="Título do evento"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />

        <textarea
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-400 transition-colors focus:border-[#00FF88] focus:outline-none"
        />

        <Input
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>}
          placeholder="Telefone de suporte (opcional)"
          value={telefoneSuporte}
          onChange={(e) => setTelefoneSuporte(e.target.value)}
        />

        <Input
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>}
          placeholder="Email de suporte (opcional)"
          value={emailSuporte}
          onChange={(e) => setEmailSuporte(e.target.value)}
        />

        <div className="border-t border-slate-800 pt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Endereço (opcional)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input
              icon={null}
              placeholder="CEP"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="col-span-2 sm:col-span-1"
            />
            <Input
              icon={null}
              placeholder="Rua"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              className="col-span-2"
            />
            <Input
              icon={null}
              placeholder="Número"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
            <Input
              icon={null}
              placeholder="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
            <Input
              icon={null}
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-3 text-sm text-white focus:border-[#00FF88] focus:outline-none"
            >
              <option value="">UF</option>
              {ESTADOS_UF.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Categorias *</h2>
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
                  <button
                    type="button"
                    onClick={() => removerCategoria(idx)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={adicionarCategoria}
            className="mt-3 text-sm text-[#00FF88] hover:underline"
          >
            + Adicionar categoria
          </button>
        </div>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <Button type="submit" loading={enviando}>
          Criar Evento
        </Button>
      </form>
    </div>
  )
}
