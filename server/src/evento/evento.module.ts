import { Module } from '@nestjs/common';
import { EventoController } from './evento.controller';
import { EventoRepository } from './evento.repository';
import { EventoService } from './evento.service';

@Module({
  controllers: [EventoController],
  providers: [EventoService, EventoRepository],
})
export class EventoModule {}
