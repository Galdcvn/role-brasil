import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CriarReservaDto } from './dto/criar-reserva.dto';
import { ReservaService } from './reserva.service';

@Controller('reservas')
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  @Post()
  criar(
    @Req() requisicao: { user: { sub: number } },
    @Body() dto: CriarReservaDto,
  ) {
    return this.reservaService.criar(requisicao.user.sub, dto);
  }

  @Get()
  listar(@Req() requisicao: { user: { sub: number } }) {
    return this.reservaService.listar(requisicao.user.sub);
  }
}
