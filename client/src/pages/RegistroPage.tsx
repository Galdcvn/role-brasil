import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

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
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const labels = ROTULOS_PAPEL[papel] ?? ROTULOS_PAPEL.CLIENT;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
  }

  return (
    <AuthLayout>
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold tracking-wide text-white">Rolê Brasil</h1>
        <p className="mt-1 text-sm font-semibold text-slate-400">{labels.subtitulo}</p>
      </div>

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

        <Input
          icon={LockIcon}
          type="password"
          placeholder="Confirmar senha"
          showToggle
          autoComplete="new-password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />

        <Button type="submit">{labels.botao}</Button>
      </form>

      <div className="mt-4 text-center text-sm text-slate-400">
        <p>
          Já tem uma conta?{' '}
          <Link to="/login" className="font-semibold text-[#00FF88] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
