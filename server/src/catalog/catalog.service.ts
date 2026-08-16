import { Injectable } from '@nestjs/common';
import { CatalogItem } from './providers/catalog.provider';
import { TmdbAdapter } from './providers/tmdb.adapter';

@Injectable()
export class CatalogService {
  constructor(private readonly tmdbAdapter: TmdbAdapter) {}

  buscarFilmes(termo: string): Promise<CatalogItem[]> {
    return this.tmdbAdapter.search(termo);
  }

  detalharFilme(id: number): Promise<CatalogItem | null> {
    return this.tmdbAdapter.getById(id);
  }
}
