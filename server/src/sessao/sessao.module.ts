import { Module } from '@nestjs/common';
import { SessaoController } from './sessao.controller';
import { SessaoRepository } from './sessao.repository';
import { SessaoService } from './sessao.service';

@Module({
  controllers: [SessaoController],
  providers: [SessaoService, SessaoRepository],
  exports: [SessaoRepository],
})
export class SessaoModule {}
