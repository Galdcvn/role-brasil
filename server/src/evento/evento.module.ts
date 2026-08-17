import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { EventoController } from './evento.controller';
import { EventoPublicoController } from './evento-publico.controller';
import { EventoRepository } from './evento.repository';
import { EventoService } from './evento.service';

@Module({
  imports: [CatalogModule],
  controllers: [EventoController, EventoPublicoController],
  providers: [EventoService, EventoRepository],
  exports: [EventoRepository],
})
export class EventoModule {}
