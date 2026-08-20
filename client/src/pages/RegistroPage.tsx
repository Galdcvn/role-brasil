import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import logoTexto from '../assets/RB_Logo_Texto.png'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

const UserIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
)

const MailIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
)

const LockIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
)

const ROTULOS_PAPEL: Record<string, { subtitulo: string; botao: string }> = {
  CLIENT: { subtitulo: 'Crie sua conta.', botao: 'Cadastrar' },
  ORGANIZER: {
    subtitulo: 'Crie sua conta de Organizador.',
    botao: 'Cadastrar como Organizador',
  },
  PORTARIA: {
    subtitulo: 'Crie sua conta de Portaria.',
    botao: 'Cadastrar como Portaria',
  },
}

interface Props {
  papel: string
}

export default function RegistroPage({ papel }: Props) {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [etapa, setEtapa] = useState<'formulario' | 'verificacao'>('formulario')
  const [codigo, setCodigo] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useDocumentTitle('Criar Conta')

  const labels = ROTULOS_PAPEL[papel] ?? ROTULOS_PAPEL.CLIENT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    try {
      const res = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, papel }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setErro(body?.message ?? 'Não foi possível realizar o cadastro.')
        return
      }

      setEtapa('verificacao')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleVerificar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const res = await fetch(`${API_URL}/auth/verificar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: Number(codigo) }),
      })

      if (!res.ok) {
        setErro('Código inválido ou expirado.')
        return
      }

      navigate('/login', { state: { sucesso: 'Conta criada! Faça login.' } })
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleReenviar() {
    if (cooldown > 0) return

    setErro('')
    try {
      const res = await fetch(`${API_URL}/auth/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        setErro('Não foi possível reenviar o código.')
        return
      }

      setCooldown(60)
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6 flex flex-col items-center">
        <img src={logoTexto} alt="Rolê Brasil" className="h-14" />
        <p className="mt-2 text-sm font-semibold text-slate-400">{labels.subtitulo}</p>
      </div>

      {etapa === 'formulario' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={UserIcon}
            type="text"
            placeholder="Nome completo"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Input
            icon={MailIcon}
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            icon={LockIcon}
            type="password"
            placeholder="Senha"
            showToggle
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p className="-mt-2 text-xs text-slate-500">Mínimo 6 caracteres</p>

          <Input
            icon={LockIcon}
            type="password"
            placeholder="Confirmar senha"
            showToggle
            autoComplete="new-password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          {erro && (
            <p className="text-center text-sm text-red-400">{erro}</p>
          )}

          <Button type="submit" loading={carregando}>
            {labels.botao}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerificar} className="space-y-4">
          <p className="text-center text-sm text-slate-400">
            Enviamos um código de verificação para <strong className="text-white">{email}</strong>.
          </p>

          <Input
            icon={LockIcon}
            type="text"
            placeholder="Código de verificação"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />

          {erro && (
            <p className="text-center text-sm text-red-400">{erro}</p>
          )}

          <Button type="submit" loading={carregando}>
            Verificar e-mail
          </Button>

          <button
            type="button"
            onClick={handleReenviar}
            disabled={cooldown > 0}
            className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
          </button>
        </form>
      )}

      <div className="mt-4 text-center text-sm text-slate-400">
        <p>
          Já tem uma conta?{' '}
          <Link to="/login" className="font-semibold text-[#00FF88] hover:underline">
            Entrar
          </Link>
        </p>
        <p className="mt-2">
          <Link to="/registro" className="text-xs text-slate-500 hover:text-slate-300">
            ← Voltar para seleção de papel
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
