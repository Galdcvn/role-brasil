import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ROTAS_POR_PAPEL: Record<string, string[]> = {
  CLIENT: ['/portal/cliente', '/portal/cliente/evento', '/portal/cliente/favoritos', '/portal/cliente/ingressos', '/portal/perfil'],
  ORGANIZER: ['/portal/organizador', '/portal/organizador/eventos', '/portal/organizador/evento', '/portal/organizador/relatorios', '/portal/perfil'],
  PORTARIA: ['/portal/portaria', '/portal/perfil'],
}

function temAcesso(roles: string[], pathname: string): boolean {
  if (pathname === '/portal') return true
  return roles.some((role) => {
    const rotas = ROTAS_POR_PAPEL[role]
    return rotas?.some((rota) => pathname.startsWith(rota)) ?? false
  })
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAutenticado, user } = useAuth()
  const location = useLocation()
  if (!isAutenticado) {
    return <Navigate to="/login" replace />
  }
  if (user?.roles && !temAcesso(user.roles, location.pathname)) {
    return <Navigate to="/portal" replace />
  }
  return children
}
