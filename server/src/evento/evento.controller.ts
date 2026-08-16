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
import { AtualizarEventoDto } from './dto/atualizar-evento.dto';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { EventoService } from './evento.service';

@Roles('ORGANIZER')
@Controller('eventos')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Post()
  criar(
    @Req() requisicao: { user: { sub: number } },
    @Body() dto: CriarEventoDto,
  ) {
    return this.eventoService.criar(requisicao.user.sub, dto);
  }

  @Get()
  listar(@Req() requisicao: { user: { sub: number } }) {
    return this.eventoService.listar(requisicao.user.sub);
  }

  @Get(':id')
  detalhe(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventoService.detalhe(requisicao.user.sub, id);
  }

  @Patch(':id')
  atualizar(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarEventoDto,
  ) {
    return this.eventoService.atualizar(requisicao.user.sub, id, dto);
  }

  @Delete(':id')
  excluir(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventoService.excluir(requisicao.user.sub, id);
  }

  @Post(':id/cancelar')
  cancelar(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventoService.cancelar(requisicao.user.sub, id);
  }

  @Post(':id/publicar')
  publicar(
    @Req() requisicao: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventoService.publicar(requisicao.user.sub, id);
  }
}
