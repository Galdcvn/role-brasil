import { Injectable } from '@nestjs/common';
import { AssentoRepository } from './assento.repository';

@Injectable()
export class AssentoService {
  constructor(private readonly assentoRepository: AssentoRepository) {}

  async mapa(sessaoId: number) {
    const assentos = await this.assentoRepository.listarPorSessao(sessaoId);

    const fileiras = new Map<
      string,
      { id: number; numero: number; status: string }[]
    >();

    for (const assento of assentos) {
      const lista = fileiras.get(assento.fileira) ?? [];
      lista.push(assento);
      fileiras.set(assento.fileira, lista);
    }

    return Array.from(fileiras.entries()).map(([fileira, assentos]) => ({
      fileira,
      assentos,
    }));
  }

  async buscarPorIds(ids: number[]) {
    return this.assentoRepository.buscarPorIds(ids);
  }
}
