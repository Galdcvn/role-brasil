import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

interface PortalContextValue {
  roleAtivo: string
  setRoleAtivo: (role: string) => void
  papeisDisponiveis: string[]
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const papeisRef = useRef(user?.roles ?? [])
  papeisRef.current = user?.roles ?? []
  const papeisDisponiveis = papeisRef.current
  const [roleAtivo, setRoleAtivoState] = useState(
    () => papeisDisponiveis[0] ?? 'CLIENT',
  )

  const setRoleAtivo = useCallback(
    (role: string) => {
      if (papeisRef.current.includes(role)) {
        setRoleAtivoState(role)
      }
    },
    [],
  )

  const value = useMemo(
    () => ({ roleAtivo, setRoleAtivo, papeisDisponiveis }),
    [roleAtivo, setRoleAtivo, papeisDisponiveis],
  )

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal deve ser usado dentro de PortalProvider')
  return ctx
}
