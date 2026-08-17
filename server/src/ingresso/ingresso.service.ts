import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IngressoRepository } from './ingresso.repository';

@Injectable()
export class IngressoService {
  constructor(private readonly ingressoRepository: IngressoRepository) {}

  async listar(usuarioId: number) {
    return this.ingressoRepository.listarPorUsuario(usuarioId);
  }

  async detalhe(usuarioId: number, ingressoId: number) {
    const ingresso = await this.ingressoRepository.buscarPorId(ingressoId);
    if (ingresso === null || ingresso.usuarioId !== usuarioId) {
      throw new NotFoundException('Ingresso não encontrado');
    }
    return ingresso;
  }

  async cancelar(usuarioId: number, ingressoId: number) {
    const ingresso = await this.ingressoRepository.buscarPorId(ingressoId);
    if (ingresso === null || ingresso.usuarioId !== usuarioId) {
      throw new NotFoundException('Ingresso não encontrado');
    }

    if (ingresso.status !== 'EMITIDO') {
      throw new ConflictException('Só é possível cancelar ingressos emitidos');
    }

    const dataEvento = ingresso.reserva.sessao.dataHora;
    const diasRestantes =
      (dataEvento.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (diasRestantes < 7) {
      throw new BadRequestException(
        'Cancelamento só é permitido até 7 dias antes do evento',
      );
    }

    return this.ingressoRepository.cancelar(ingressoId);
  }
}
