import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { ValidarIngressoDto } from './dto/validar-ingresso.dto';
import { PortariaService } from './portaria.service';

@Roles('PORTARIA')
@Controller('portaria')
export class PortariaController {
  constructor(private readonly portariaService: PortariaService) {}

  @Post('validar')
  validar(
    @Req() requisicao: { user: { sub: number } },
    @Body() dto: ValidarIngressoDto,
  ) {
    return this.portariaService.validar(requisicao.user.sub, dto);
  }

  @Post('comprovantes/:id/confirmar')
  confirmarComprovante(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.portariaService.confirmarComprovante(requisicao.user.sub, id);
  }

  @Post('comprovantes/:id/rejeitar')
  rejeitarComprovante(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.portariaService.rejeitarComprovante(requisicao.user.sub, id);
  }

  @Get('historico')
  historico(@Req() requisicao: { user: { sub: number } }) {
    return this.portariaService.listarHistorico(requisicao.user.sub);
  }

  @Get('historico/:eventoId')
  historicoPorEvento(
    @Req() requisicao: { user: { sub: number } },
    @Param('eventoId', ParseIntPipe) eventoId: number,
  ) {
    return this.portariaService.listarHistoricoPorEvento(
      requisicao.user.sub,
      eventoId,
    );
  }
}
