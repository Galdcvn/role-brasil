import { Module } from '@nestjs/common';
import { MensagemController } from './mensagem.controller';
import { MensagemGlobalController } from './mensagem-global.controller';
import { MensagemRepository } from './mensagem.repository';
import { MensagemService } from './mensagem.service';

@Module({
  controllers: [MensagemController, MensagemGlobalController],
  providers: [MensagemService, MensagemRepository],
  exports: [MensagemRepository, MensagemService],
})
export class MensagemModule {}
