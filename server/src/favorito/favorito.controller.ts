import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { FavoritoService } from './favorito.service';

@Controller('favoritos')
export class FavoritoController {
  constructor(private readonly favoritoService: FavoritoService) {}

  @Post(':eventoId')
  toggle(
    @Req() requisicao: { user: { sub: number } },
    @Param('eventoId', ParseIntPipe) eventoId: number,
  ) {
    return this.favoritoService.toggle(requisicao.user.sub, eventoId);
  }

  @Get()
  listar(@Req() requisicao: { user: { sub: number } }) {
    return this.favoritoService.listar(requisicao.user.sub);
  }
}
