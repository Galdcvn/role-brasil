import { Module } from '@nestjs/common';
import { AssentoModule } from '../assento/assento.module';
import { ReservaController } from './reserva.controller';
import { ReservaRepository } from './reserva.repository';
import { ReservaService } from './reserva.service';

@Module({
  imports: [AssentoModule],
  controllers: [ReservaController],
  providers: [ReservaService, ReservaRepository],
  exports: [ReservaRepository, ReservaService],
})
export class ReservaModule {}
