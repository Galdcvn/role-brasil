import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { IngressoService } from './ingresso.service';

@Controller('ingressos')
export class IngressoController {
  constructor(private readonly ingressoService: IngressoService) {}

  @Get()
  listar(@Req() requisicao: { user: { sub: number } }) {
    return this.ingressoService.listar(requisicao.user.sub);
  }

  @Get(':id')
  detalhe(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ingressoService.detalhe(requisicao.user.sub, id);
  }

  @Post(':id/cancelar')
  cancelar(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ingressoService.cancelar(requisicao.user.sub, id);
  }
}
