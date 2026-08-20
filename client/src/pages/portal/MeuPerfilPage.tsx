import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

interface Usuario {
  id: number
  nome: string
  email: string
  verificado: boolean
  criadoEm: string
  papeis: { papel: { nome: string } }[]
}

const LABELS_PAPEL: Record<string, string> = {
  CLIENT: 'Cliente',
  ORGANIZER: 'Organizador',
  PORTARIA: 'Portaria',
}

export default function MeuPerfilPage() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [perfilMsg, setPerfilMsg] = useState<string | null>(null)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState<string | null>(null)

  useDocumentTitle('Meu Perfil')

  useEffect(() => {
    api<Usuario>('/usuario/me')
      .then((u) => {
        setUsuario(u)
        setNome(u.nome)
        setEmail(u.email)
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setPerfilMsg(null)
    setErro(null)
    if (!nome.trim()) {
      setErro('Nome é obrigatório')
      return
    }
    setSalvandoPerfil(true)
    try {
      await api('/usuario/me', {
        method: 'PATCH',
        body: JSON.stringify({ nome: nome.trim() }),
      })
      setPerfilMsg('Perfil atualizado com sucesso')
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvandoPerfil(false)
    }
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()
    setSenhaMsg(null)
    setErro(null)
    if (!senhaAtual || !novaSenha) {
      setErro('Preencha todos os campos de senha')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não conferem')
      return
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    setSalvandoSenha(true)
    try {
      await api('/usuario/me/senha', {
        method: 'PATCH',
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      setSenhaMsg('Senha alterada com sucesso')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao alterar senha')
    } finally {
      setSalvandoSenha(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">
          &larr; Voltar
        </button>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {usuario && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Informações</h2>
          <div className="mb-3 space-y-1 text-sm text-slate-400">
            <p>Função(ões): {usuario.papeis.map((p) => LABELS_PAPEL[p.papel.nome] ?? p.papel.nome).join(', ')}</p>
            <p>Membro desde: {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}</p>
          </div>
          <form onSubmit={salvarPerfil} className="space-y-3">
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              disabled
              className="w-full rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2.5 text-sm text-slate-500 placeholder-slate-400"
            />
            {perfilMsg && <p className="text-xs text-[#00FF88]">{perfilMsg}</p>}
            <Button type="submit" loading={salvandoPerfil}>
              Salvar
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Alterar Senha</h2>
        <form onSubmit={alterarSenha} className="space-y-3">
          <input
            type="password"
            placeholder="Senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
          />
          <input
            type="password"
            placeholder="Nova senha (mínimo 6 caracteres)"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#00FF88] focus:outline-none"
          />
          {senhaMsg && <p className="text-xs text-[#00FF88]">{senhaMsg}</p>}
          <Button type="submit" loading={salvandoSenha}>
            Alterar Senha
          </Button>
        </form>
      </Card>
    </div>
  )
}
