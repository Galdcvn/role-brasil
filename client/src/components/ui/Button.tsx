interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export default function Button({ loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`w-full rounded-lg bg-[#00FF88] py-3 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00FF88]/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">Carregando...</span>
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
        </>
      ) : (
        children
      )}
    </button>
  )
}
