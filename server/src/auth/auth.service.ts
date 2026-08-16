import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
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
    const senha = await bcrypt.hash(dto.senha, 10);

    let usuario: Awaited<ReturnType<UsuarioRepository['create']>>;
    try {
      usuario = await this.usuarioRepository.create({
        nome: dto.nome,
        email: dto.email,
        senha,
        papel: dto.papel ?? NOME_PAPEL_CLIENT,
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw erro;
    }

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
      throw new UnauthorizedException('E-mail ainda não verificado');
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
