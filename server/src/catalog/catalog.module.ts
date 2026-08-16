import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { TmdbAdapter } from './providers/tmdb.adapter';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, TmdbAdapter],
  exports: [CatalogService],
})
export class CatalogModule {}
