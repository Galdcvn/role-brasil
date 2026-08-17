import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { MensagemService } from './mensagem.service';

@Controller('mensagens')
export class MensagemGlobalController {
  constructor(private readonly mensagemService: MensagemService) {}

  @Get('nao-lidas')
  contarNaoLidas(@Req() requisicao: { user: { sub: number } }) {
    return this.mensagemService.contarNaoLidas(requisicao.user.sub);
  }

  @Patch(':id/lida')
  marcarLida(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.mensagemService.marcarLida(requisicao.user.sub, id);
  }
}
