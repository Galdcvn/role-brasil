import { useEffect } from 'react'

export function useBeforeUnload(when: boolean, message = 'Você tem alterações não salvas. Deseja sair?') {
  useEffect(() => {
    if (!when) return
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = message
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [when, message])
}
