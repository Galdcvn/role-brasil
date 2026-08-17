import { Injectable } from '@nestjs/common';
import { FavoritoRepository } from './favorito.repository';

@Injectable()
export class FavoritoService {
  constructor(private readonly favoritoRepository: FavoritoRepository) {}

  async toggle(usuarioId: number, eventoId: number) {
    const existente = await this.favoritoRepository.buscar(usuarioId, eventoId);

    if (existente) {
      await this.favoritoRepository.remover(usuarioId, eventoId);
      return { favoritado: false };
    }

    await this.favoritoRepository.adicionar(usuarioId, eventoId);
    return { favoritado: true };
  }

  async listar(usuarioId: number) {
    const favoritos = await this.favoritoRepository.listarEventosIds(usuarioId);
    return favoritos.map((f) => f.eventoId);
  }
}
