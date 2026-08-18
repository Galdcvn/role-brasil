import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface Usuario {
  id: number
  email: string
  roles: string[]
}

interface AuthContextValue {
  user: Usuario | null
  isAutenticado: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface JwtPayload {
  sub: number
  email: string
  roles: string[]
}

function decodificarToken(token: string): Usuario | null {
  try {
    const payload = token.split('.')[1]
    const decoded: JwtPayload = JSON.parse(atob(payload))
    return { id: decoded.sub, email: decoded.email, roles: decoded.roles }
  } catch {
    return null
  }
}

function tokenValido(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    const decoded: JwtPayload = JSON.parse(atob(payload))
    const expMs = (decoded as unknown as { exp: number }).exp * 1000
    return Date.now() < expMs
  } catch {
    return false
  }
}

function tokenInicial(): string | null {
  const t = localStorage.getItem('token')
  if (t && tokenValido(t)) return t
  localStorage.removeItem('token')
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(tokenInicial)

  const user = useMemo(() => (token ? decodificarToken(token) : null), [token])

  const login = useCallback((novoToken: string) => {
    localStorage.setItem('token', novoToken)
    setToken(novoToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAutenticado: user !== null, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
