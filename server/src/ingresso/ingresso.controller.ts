import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
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

  @Public()
  @Get('publico/:codigo')
  compartilhar(@Param('codigo') codigo: string) {
    return this.ingressoService.compartilhar(codigo);
  }
}
