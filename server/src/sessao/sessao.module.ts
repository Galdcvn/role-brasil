import { Module } from '@nestjs/common';
import { SessaoController } from './sessao.controller';
import { SessaoRepository } from './sessao.repository';
import { SessaoService } from './sessao.service';

@Module({
  controllers: [SessaoController],
  providers: [SessaoService, SessaoRepository],
})
export class SessaoModule {}
