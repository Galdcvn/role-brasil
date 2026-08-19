import { Module } from '@nestjs/common';
import { AssentoModule } from '../assento/assento.module';
import { ReservaController } from './reserva.controller';
import { ReservaExpirationScheduler } from './reserva-expiration.scheduler';
import { ReservaRepository } from './reserva.repository';
import { ReservaService } from './reserva.service';

@Module({
  imports: [AssentoModule],
  controllers: [ReservaController],
  providers: [ReservaService, ReservaRepository, ReservaExpirationScheduler],
  exports: [ReservaRepository, ReservaService],
})
export class ReservaModule {}
