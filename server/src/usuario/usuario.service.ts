import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { UsuarioRepository } from './usuario.repository';

@Injectable()
export class UsuarioService {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  me(usuarioId: number) {
    return this.usuarioRepository.findById(usuarioId);
  }

  atualizarPerfil(usuarioId: number, dto: AtualizarUsuarioDto) {
    return this.usuarioRepository.update(usuarioId, dto);
  }

  async alterarSenha(usuarioId: number, dto: AlterarSenhaDto) {
    const usuario = await this.usuarioRepository.findByIdComSenha(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const senhaConfere = await bcrypt.compare(dto.senhaAtual, usuario.senha);
    if (!senhaConfere) {
      throw new BadRequestException('Senha atual incorreta');
    }
    const novaSenhaHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.usuarioRepository.updateSenha(usuarioId, novaSenhaHash);
    return { mensagem: 'Senha alterada com sucesso' };
  }

  desativar(usuarioId: number) {
    return this.usuarioRepository.desativar(usuarioId);
  }
}
