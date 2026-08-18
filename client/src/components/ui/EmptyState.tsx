import { Link } from 'react-router-dom'

interface EmptyStateProps {
  titulo: string
  descricao: string
  ctaLabel?: string
  ctaTo?: string
  onCtaClick?: () => void
}

export default function EmptyState({ titulo, descricao, ctaLabel, ctaTo, onCtaClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl text-slate-600">&#9744;</div>
      <h3 className="mb-1 text-lg font-semibold text-white">{titulo}</h3>
      <p className="mb-6 max-w-sm text-sm text-slate-400">{descricao}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="rounded-lg bg-[#00FF88] px-5 py-2.5 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCtaClick && !ctaTo && (
        <button
          onClick={onCtaClick}
          className="rounded-lg bg-[#00FF88] px-5 py-2.5 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
