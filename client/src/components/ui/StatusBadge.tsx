const CORES: Record<string, string> = {
  RASCUNHO: 'bg-slate-700 text-slate-300',
  PUBLICADO: 'bg-emerald-900/60 text-emerald-400',
  CANCELADO: 'bg-red-900/60 text-red-400',
  ATIVA: 'bg-emerald-900/60 text-emerald-400',
  CANCELADA: 'bg-red-900/60 text-red-400',
  EMITIDO: 'bg-emerald-900/60 text-emerald-400',
  USADO: 'bg-amber-900/60 text-amber-400',
  PENDENTE: 'bg-yellow-900/60 text-yellow-400',
  PAGO: 'bg-emerald-900/60 text-emerald-400',
  RECUSADO: 'bg-red-900/60 text-red-400',
  CONFIRMADA: 'bg-emerald-900/60 text-emerald-400',
  EXPIRADA: 'bg-orange-900/60 text-orange-400',
  APROVADO: 'bg-emerald-900/60 text-emerald-400',
  PENDENTE_DOCUMENTACAO: 'bg-yellow-900/60 text-yellow-400',
  REJEITADO: 'bg-red-900/60 text-red-400',
  DOCUMENTACAO_CONFIRMADA: 'bg-emerald-900/60 text-emerald-400',
  DOCUMENTACAO_RECUSADA: 'bg-red-900/60 text-red-400',
  NAO_NECESSARIO: 'bg-slate-700 text-slate-300',
}

const LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  CANCELADO: 'Cancelado',
  ATIVA: 'Ativa',
  CANCELADA: 'Cancelada',
  EMITIDO: 'Emitido',
  USADO: 'Usado',
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  RECUSADO: 'Recusado',
  CONFIRMADA: 'Confirmada',
  EXPIRADA: 'Expirada',
  APROVADO: 'Aprovado',
  PENDENTE_DOCUMENTACAO: 'Pendente Doc.',
  REJEITADO: 'Rejeitado',
  DOCUMENTACAO_CONFIRMADA: 'Doc. Confirmada',
  DOCUMENTACAO_RECUSADA: 'Doc. Recusada',
  NAO_NECESSARIO: 'N/A',
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const classes = CORES[status] ?? 'bg-slate-700 text-slate-300'
  const label = LABELS[status] ?? status
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
