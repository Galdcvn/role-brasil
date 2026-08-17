import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { MensagemService } from './mensagem.service';

class EnviarMensagemDto {
  conteudo!: string;
}

@Controller('eventos/:eventoId/mensagens')
export class MensagemController {
  constructor(private readonly mensagemService: MensagemService) {}

  @Post()
  enviar(
    @Req() requisicao: { user: { sub: number } },
    @Param('eventoId', ParseIntPipe) eventoId: number,
    @Body() dto: EnviarMensagemDto,
  ) {
    return this.mensagemService.enviar(
      requisicao.user.sub,
      eventoId,
      dto.conteudo,
    );
  }

  @Get()
  listar(
    @Req() requisicao: { user: { sub: number } },
    @Param('eventoId', ParseIntPipe) eventoId: number,
  ) {
    return this.mensagemService.listarPorEvento(requisicao.user.sub, eventoId);
  }
}
