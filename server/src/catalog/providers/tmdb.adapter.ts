import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogItem, CatalogProvider } from './catalog.provider';

@Injectable()
export class TmdbAdapter implements CatalogProvider {
  constructor(private readonly config: ConfigService) {}

  search(): Promise<CatalogItem[]> {
    throw new Error('Not implemented');
  }

  getById(): Promise<CatalogItem | null> {
    throw new Error('Not implemented');
  }
}
