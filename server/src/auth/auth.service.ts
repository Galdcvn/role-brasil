import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { gerarCodigoOtp } from '../utils/otp.util';
import {
  NOME_PAPEL_CLIENT,
  UsuarioRepository,
} from '../usuario/usuario.repository';
import { RegistrarDto } from './dto/registrar.dto';
import { VerificarEmailDto } from './dto/verificar-email.dto';

const TTL_CODIGO_MS = 10 * 60 * 1000;

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registrar(dto: RegistrarDto) {
    const papel = dto.papel ?? NOME_PAPEL_CLIENT;
    const existente = await this.usuarioRepository.findByEmail(dto.email);

    if (existente) {
      const papelVinculado = existente.papeis.some(
        (p) => p.papel.nome === papel,
      );

      if (papelVinculado) {
        if (existente.verificado) {
          throw new ConflictException('Não foi possível realizar o cadastro');
        }

        await this.gerarNovoCodigo(existente.id);
        return {
          id: existente.id,
          nome: existente.nome,
          email: existente.email,
          verificado: existente.verificado,
        };
      }

      await this.usuarioRepository.adicionarPapel(existente.id, papel);

      if (existente.verificado) {
        return {
          id: existente.id,
          nome: existente.nome,
          email: existente.email,
          verificado: existente.verificado,
        };
      }

      await this.gerarNovoCodigo(existente.id);
      return {
        id: existente.id,
        nome: existente.nome,
        email: existente.email,
        verificado: existente.verificado,
      };
    }

    const senha = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.usuarioRepository.create({
      nome: dto.nome,
      email: dto.email,
      senha,
      papel,
    });

    await this.gerarNovoCodigo(usuario.id);

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      verificado: usuario.verificado,
    };
  }

  async verificarEmail(dto: VerificarEmailDto) {
    const usuario = await this.usuarioRepository.findByEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    const permitirFallback =
      this.config.get<boolean>('ALLOW_OTP_FALLBACK') === true;
    const expirado =
      usuario.codigoVerificacaoExpiraEm === null ||
      Date.now() > usuario.codigoVerificacaoExpiraEm.getTime();
    const codigoConfere =
      (permitirFallback && dto.codigo === 0) ||
      (usuario.codigoVerificacao !== null &&
        dto.codigo === usuario.codigoVerificacao);

    if (!codigoConfere || expirado) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    await this.usuarioRepository.updateVerificado(usuario.id);
    return { mensagem: 'E-mail verificado com sucesso' };
  }

  async reenviarCodigo(email: string) {
    const usuario = await this.usuarioRepository.findByEmail(email);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (usuario.verificado) {
      return { mensagem: 'E-mail já verificado' };
    }

    await this.gerarNovoCodigo(usuario.id);
    return { mensagem: 'Código reenviado com sucesso' };
  }

  async validarCredenciais(
    email: string,
    senha: string,
  ): Promise<UsuarioLogado> {
    const usuario = await this.usuarioRepository.findByEmailComSenha(email);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (!usuario.verificado) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha);
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      roles: usuario.papeis.map((papeisUsuario) => papeisUsuario.papel.nome),
    };
  }

  login(usuario: UsuarioLogado) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      roles: usuario.roles,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  private async gerarNovoCodigo(usuarioId: number): Promise<number> {
    const codigo = gerarCodigoOtp();
    await this.usuarioRepository.setCodigoVerificacao(
      usuarioId,
      codigo,
      new Date(Date.now() + TTL_CODIGO_MS),
    );
    return codigo;
  }
}
