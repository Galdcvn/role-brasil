interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${onClick ? 'cursor-pointer transition-colors hover:border-slate-700' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
