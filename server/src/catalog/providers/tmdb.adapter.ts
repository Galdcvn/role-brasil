import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogItem, CatalogProvider } from './catalog.provider';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  release_date: string | null;
}

interface TmdbSearchResponse {
  results: TmdbMovie[];
}

const URL_BASE = 'https://api.themoviedb.org/3';
const URL_IMAGEM = 'https://image.tmdb.org/t/p/w500';
const TIMEOUT_MS = 10_000;

@Injectable()
export class TmdbAdapter implements CatalogProvider {
  private readonly chave: string;

  constructor(private readonly config: ConfigService) {
    this.chave = this.config.get<string>('TMDB_API_KEY') ?? '';
  }

  async search(query: string): Promise<CatalogItem[]> {
    const dados = await this.buscar<TmdbSearchResponse>(
      `/search/movie?language=pt-BR&query=${encodeURIComponent(query)}`,
    );
    return dados?.results.map((filme) => this.normalizar(filme)) ?? [];
  }

  async getById(id: number): Promise<CatalogItem | null> {
    const filme = await this.buscar<TmdbMovie>(`/movie/${id}?language=pt-BR`);
    return filme ? this.normalizar(filme) : null;
  }

  private async buscar<T>(caminho: string): Promise<T | null> {
    if (!this.chave) {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const resposta = await fetch(
      `${URL_BASE}${caminho}&api_key=${this.chave}`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (resposta.status === 404) {
      return null;
    }
    if (!resposta.ok) {
      throw new Error(`TMDb respondeu ${resposta.status}`);
    }
    return (await resposta.json()) as T;
  }

  private normalizar(filme: TmdbMovie): CatalogItem {
    const ano = filme.release_date ? Number(filme.release_date.slice(0, 4)) : 0;
    return {
      id: filme.id,
      titulo: filme.title,
      descricao: filme.overview ?? '',
      posterUrl: filme.poster_path ? `${URL_IMAGEM}${filme.poster_path}` : '',
      ano: Number.isNaN(ano) ? 0 : ano,
    };
  }
}
