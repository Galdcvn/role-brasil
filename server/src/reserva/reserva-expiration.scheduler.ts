import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ReservaService } from './reserva.service';

@Injectable()
export class ReservaExpirationScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReservaExpirationScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly reservaService: ReservaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.reservaService
        .expirarReservas()
        .then((count) => {
          if (count > 0) {
            this.logger.log(`${count} reserva(s) expirada(s) automaticamente`);
          }
        })
        .catch((err: unknown) => {
          this.logger.error('Erro ao expirar reservas', err);
        });
    }, 60_000);
    this.logger.log('Scheduler de expiração de reservas iniciado (60s)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
