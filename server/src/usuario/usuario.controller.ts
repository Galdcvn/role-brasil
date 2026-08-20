import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioAutenticado } from '../auth/types/autenticado';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
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

  @Patch('me/senha')
  async alterarSenha(
    @Req() req: RequestComUsuario,
    @Body() dto: AlterarSenhaDto,
  ) {
    return this.usuarioService.alterarSenha(req.user.sub, dto);
  }

  @Patch('me/desativar')
  desativar(@Req() req: RequestComUsuario) {
    return this.usuarioService.desativar(req.user.sub);
  }
}
