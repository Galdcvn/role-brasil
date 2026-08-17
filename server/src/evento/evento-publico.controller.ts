import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BuscarEventosDto } from './dto/buscar-eventos-publicos.dto';
import { EventoService } from './evento.service';

@Controller('eventos/publicos')
export class EventoPublicoController {
  constructor(private readonly eventoService: EventoService) {}

  @Get()
  listar(@Query() filtros: BuscarEventosDto) {
    return this.eventoService.listarPublicos(filtros);
  }

  @Get(':id')
  detalhe(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.detalhePublico(id);
  }
}
