import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

interface EventoFavorito {
  id: number
  titulo: string
  posterUrl: string | null
  status: string
  categorias: { nome: string; precoCentavos: number }[]
  endereco: { cidade: string; estado: string } | null
  proximaSessao: { dataHora: string; vagasDisponiveis: number } | null
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarCentavos(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

export default function FavoritosPage() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<EventoFavorito[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useDocumentTitle('Favoritos')

  function carregar() {
    setLoading(true)
    setErro(null)
    api<EventoFavorito[]>('/favoritos/eventos')
      .then(setEventos)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Meus Favoritos</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Meus Favoritos</h1>

      {erro ? (
        <div className="text-center">
          <p className="mb-3 text-red-400">{erro}</p>
          <Button onClick={carregar}>Tentar novamente</Button>
        </div>
      ) : eventos.length === 0 ? (
        <EmptyState
          titulo="Nenhum favorito"
          descricao="Explore eventos e favorite os que mais curtir."
          ctaLabel="Explorar Eventos"
          onCtaClick={() => navigate('/portal/cliente')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => (
            <Link
              key={evento.id}
              to={`/portal/cliente/evento/${evento.id}`}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-colors hover:border-slate-700"
            >
              {evento.posterUrl ? (
                <img
                  src={evento.posterUrl}
                  alt={evento.titulo}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-slate-800 text-2xl text-slate-600">
                  🎬
                </div>
              )}
              <div className="p-3">
                <h3 className="truncate font-semibold text-white">{evento.titulo}</h3>
                {evento.endereco && (
                  <p className="text-xs text-slate-400">
                    {evento.endereco.cidade}/{evento.endereco.estado}
                  </p>
                )}
                {evento.categorias.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {evento.categorias.map((cat) => (
                      <span
                        key={cat.nome}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        {cat.nome} {formatarCentavos(cat.precoCentavos)}
                      </span>
                    ))}
                  </div>
                )}
                {evento.proximaSessao && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Próxima: {formatarData(evento.proximaSessao.dataHora)} · {evento.proximaSessao.vagasDisponiveis} vagas
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
