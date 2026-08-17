import { Module } from '@nestjs/common';
import { AssentoController } from './assento.controller';
import { AssentoRepository } from './assento.repository';
import { AssentoService } from './assento.service';

@Module({
  controllers: [AssentoController],
  providers: [AssentoService, AssentoRepository],
  exports: [AssentoRepository, AssentoService],
})
export class AssentoModule {}
