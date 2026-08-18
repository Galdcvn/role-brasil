import {
  ConflictException,
  Injectable,
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

const CODIGO_FALLBACK_DEV = 0;
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
        throw new ConflictException('Não foi possível realizar o cadastro');
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

      const codigo = gerarCodigoOtp();
      await this.usuarioRepository.setCodigoVerificacao(
        existente.id,
        codigo,
        new Date(Date.now() + TTL_CODIGO_MS),
      );
      return this.comFallbackDev(
        {
          id: existente.id,
          nome: existente.nome,
          email: existente.email,
          verificado: existente.verificado,
        },
        codigo,
      );
    }

    const senha = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.usuarioRepository.create({
      nome: dto.nome,
      email: dto.email,
      senha,
      papel,
    });

    const codigo = gerarCodigoOtp();
    await this.usuarioRepository.setCodigoVerificacao(
      usuario.id,
      codigo,
      new Date(Date.now() + TTL_CODIGO_MS),
    );

    return this.comFallbackDev(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        verificado: usuario.verificado,
      },
      codigo,
    );
  }

  async verificarEmail(dto: VerificarEmailDto) {
    const usuario = await this.usuarioRepository.findByEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    const expirado =
      usuario.codigoVerificacaoExpiraEm === null ||
      Date.now() > usuario.codigoVerificacaoExpiraEm.getTime();
    const codigoConfere =
      usuario.codigoVerificacao !== null &&
      (dto.codigo === usuario.codigoVerificacao ||
        (this.fallbackDevAtivo() && dto.codigo === CODIGO_FALLBACK_DEV));

    if (!codigoConfere || expirado) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    await this.usuarioRepository.updateVerificado(usuario.id);
    return { mensagem: 'E-mail verificado com sucesso' };
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

  private fallbackDevAtivo(): boolean {
    return this.config.get<string>('ALLOW_OTP_FALLBACK') === 'true';
  }

  private comFallbackDev(
    retorno: { id: number; nome: string; email: string; verificado: boolean },
    codigo: number,
  ) {
    if (!this.fallbackDevAtivo()) {
      return retorno;
    }
    return { ...retorno, codigo };
  }
}
