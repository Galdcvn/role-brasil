import { Module } from '@nestjs/common';
import { FavoritoController } from './favorito.controller';
import { FavoritoRepository } from './favorito.repository';
import { FavoritoService } from './favorito.service';

@Module({
  controllers: [FavoritoController],
  providers: [FavoritoService, FavoritoRepository],
  exports: [FavoritoRepository],
})
export class FavoritoModule {}
