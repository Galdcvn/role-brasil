import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService, UsuarioLogado } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ReenviarCodigoDto } from './dto/reenviar-codigo.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { VerificarEmailDto } from './dto/verificar-email.dto';

type RequestComUsuarioLogado = Request & { user: UsuarioLogado };

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registrar(@Body() dto: RegistrarDto) {
    return this.authService.registrar(dto);
  }

  @Post('verificar-email')
  verificarEmail(@Body() dto: VerificarEmailDto) {
    return this.authService.verificarEmail(dto);
  }

  @Post('reenviar-codigo')
  reenviarCodigo(@Body() dto: ReenviarCodigoDto) {
    return this.authService.reenviarCodigo(dto.email);
  }

  @Post('esqueci-senha')
  esqueciSenha(@Body() dto: ReenviarCodigoDto) {
    return this.authService.esqueciSenha(dto.email);
  }

  @Post('redefinir-senha')
  redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.authService.redefinirSenha(dto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  login(@Body() _dto: LoginDto, @Req() req: RequestComUsuarioLogado) {
    return this.authService.login(req.user);
  }
}
