import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import logoTexto from '../assets/RB_Logo_Texto.png'

const PAPEIS = [
  {
    papel: 'CLIENT',
    path: '/registro/cliente',
    titulo: 'Cliente',
    descricao: 'Compra ingressos e vive os eventos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
  },
  {
    papel: 'ORGANIZER',
    path: '/registro/organizador',
    titulo: 'Organizador',
    descricao: 'Cria e gerencia seus eventos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    papel: 'PORTARIA',
    path: '/registro/portaria',
    titulo: 'Portaria',
    descricao: 'Valida ingressos na entrada',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
]

export default function SelecaoPapelPage() {
  return (
    <AuthLayout>
      <div className="mb-6 flex flex-col items-center">
        <img src={logoTexto} alt="Rolê Brasil" className="h-14" />
        <p className="mt-2 text-sm font-semibold text-slate-400">Como você quer participar?</p>
      </div>

      <div className="space-y-3">
        {PAPEIS.map((papel, index) => (
          <Link
            key={papel.papel}
            to={papel.path}
            className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-all duration-200 hover:border-[#00FF88] hover:bg-slate-800"
            style={{
              opacity: 0,
              animation: `fade-in-down 0.4s ease-out ${index * 150}ms both`,
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00FF88]/10 text-[#00FF88]">
              {papel.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{papel.titulo}</p>
              <p className="text-xs text-slate-400">{papel.descricao}</p>
            </div>
          </Link>
        ))}
      </div>

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
