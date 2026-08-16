import { Injectable } from '@nestjs/common';
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

  desativar(usuarioId: number) {
    return this.usuarioRepository.desativar(usuarioId);
  }
}
