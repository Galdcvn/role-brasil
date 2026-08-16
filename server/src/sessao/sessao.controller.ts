import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AtualizarSessaoDto } from './dto/atualizar-sessao.dto';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { SessaoService } from './sessao.service';

@Roles('ORGANIZER')
@Controller()
export class SessaoController {
  constructor(private readonly sessaoService: SessaoService) {}

  @Post('eventos/:eventoId/sessoes')
  criar(
    @Req() requisicao: { user: { sub: number } },
    @Param('eventoId', ParseIntPipe) eventoId: number,
    @Body() dto: CriarSessaoDto,
  ) {
    return this.sessaoService.criar(requisicao.user.sub, eventoId, dto);
  }

  @Get('eventos/:eventoId/sessoes')
  listar(
    @Req() requisicao: { user: { sub: number } },
    @Param('eventoId', ParseIntPipe) eventoId: number,
  ) {
    return this.sessaoService.listar(requisicao.user.sub, eventoId);
  }

  @Patch('sessoes/:id')
  atualizar(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarSessaoDto,
  ) {
    return this.sessaoService.atualizar(requisicao.user.sub, id, dto);
  }

  @Delete('sessoes/:id')
  excluir(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessaoService.excluir(requisicao.user.sub, id);
  }

  @Post('sessoes/:id/cancelar')
  cancelar(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessaoService.cancelar(requisicao.user.sub, id);
  }
}
