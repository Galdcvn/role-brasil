import Button from './Button'

interface ConfirmDialogProps {
  titulo: string
  mensagem: string
  confirmarLabel?: string
  cancelarLabel?: string
  variante?: 'perigo' | 'padrao'
  onConfirmar: () => void
  onCancelar: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  titulo,
  mensagem,
  confirmarLabel = 'Confirmar',
  cancelarLabel = 'Cancelar',
  variante = 'padrao',
  onConfirmar,
  onCancelar,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-bold text-white">{titulo}</h3>
        <p className="mb-6 text-sm text-slate-400">{mensagem}</p>
        <div className="flex gap-3">
          <Button
            onClick={onCancelar}
            className={`flex-1 ${
              variante === 'perigo'
                ? 'border border-slate-600 bg-slate-800 text-slate-300 shadow-none hover:bg-slate-700'
                : 'border border-slate-600 bg-slate-800 text-slate-300 shadow-none hover:bg-slate-700'
            }`}
            loading={false}
          >
            {cancelarLabel}
          </Button>
          <Button
            onClick={onConfirmar}
            loading={loading}
            className={`flex-1 ${
              variante === 'perigo'
                ? 'border border-red-500/40 bg-red-600/20 text-red-400 shadow-none hover:bg-red-600/30'
                : ''
            }`}
          >
            {confirmarLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
