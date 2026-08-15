import { Module } from '@nestjs/common';
import { ReservaController } from './reserva.controller';
import { ReservaRepository } from './reserva.repository';
import { ReservaService } from './reserva.service';

@Module({
  controllers: [ReservaController],
  providers: [ReservaService, ReservaRepository],
})
export class ReservaModule {}
