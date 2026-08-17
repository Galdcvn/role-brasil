import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AssentoService } from './assento.service';

@Controller('sessoes')
export class AssentoController {
  constructor(private readonly assentoService: AssentoService) {}

  @Get(':sessaoId/assentos')
  mapa(@Param('sessaoId', ParseIntPipe) sessaoId: number) {
    return this.assentoService.mapa(sessaoId);
  }
}
