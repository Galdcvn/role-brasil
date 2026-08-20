import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — Rolê Brasil` : 'Rolê Brasil'
    return () => { document.title = previous }
  }, [title])
}
