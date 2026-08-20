import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CriarPagamentoDto } from './dto/criar-pagamento.dto';
import { PagamentoRepository } from './pagamento.repository';

@Injectable()
export class PagamentoService {
  constructor(private readonly pagamentoRepository: PagamentoRepository) {}

  async processar(dto: CriarPagamentoDto) {
    const reserva = await this.pagamentoRepository.buscarReservaPendente(
      dto.reservaId,
    );

    if (reserva === null) {
      throw new NotFoundException('Reserva não encontrada ou já processada');
    }

    if (dto.tipo === 'PIX') {
      const codigoPix = `PIX${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const resultado = await this.pagamentoRepository.processarAprovado(
        dto.reservaId,
        reserva.subtotalCentavos,
        'PIX',
        undefined,
        codigoPix,
      );
      return { status: 'APROVADO' as const, ingressos: resultado.ingressos };
    }

    if (!dto.cartao) {
      throw new BadRequestException(
        'Dados do cartão são obrigatórios para pagamento com cartão',
      );
    }

    const cvv = dto.cartao.cvv;
    if (cvv === '000') {
      return { status: 'RECUSADO' as const };
    }

    const finalCartao = dto.cartao.numero.replace(/\s/g, '').slice(-4);
    const resultado = await this.pagamentoRepository.processarAprovado(
      dto.reservaId,
      reserva.subtotalCentavos,
      'CARTAO',
      { finalCartao },
    );
    return { status: 'APROVADO' as const, ingressos: resultado.ingressos };
  }
}
