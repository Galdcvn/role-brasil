import { Module } from '@nestjs/common';
import { IngressoController } from './ingresso.controller';
import { IngressoRepository } from './ingresso.repository';
import { IngressoService } from './ingresso.service';

@Module({
  controllers: [IngressoController],
  providers: [IngressoService, IngressoRepository],
})
export class IngressoModule {}
