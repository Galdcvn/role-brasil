import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioAutenticado } from '../auth/types/autenticado';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { UsuarioService } from './usuario.service';

type RequestComUsuario = Request & { user: UsuarioAutenticado };

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('me')
  me(@Req() req: RequestComUsuario) {
    return this.usuarioService.me(req.user.sub);
  }

  @Patch('me')
  atualizarPerfil(
    @Req() req: RequestComUsuario,
    @Body() dto: AtualizarUsuarioDto,
  ) {
    return this.usuarioService.atualizarPerfil(req.user.sub, dto);
  }

  @Patch('me/desativar')
  desativar(@Req() req: RequestComUsuario) {
    return this.usuarioService.desativar(req.user.sub);
  }
}
