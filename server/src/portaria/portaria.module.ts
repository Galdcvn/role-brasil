import { Module } from '@nestjs/common';
import { PortariaController } from './portaria.controller';
import { PortariaRepository } from './portaria.repository';
import { PortariaService } from './portaria.service';

@Module({
  controllers: [PortariaController],
  providers: [PortariaService, PortariaRepository],
  exports: [PortariaRepository, PortariaService],
})
export class PortariaModule {}
