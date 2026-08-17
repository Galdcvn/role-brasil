import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssentoRepository } from '../assento/assento.repository';
import { CriarReservaDto } from './dto/criar-reserva.dto';
import { ReservaRepository } from './reserva.repository';

@Injectable()
export class ReservaService {
  constructor(
    private readonly reservaRepository: ReservaRepository,
    private readonly assentoRepository: AssentoRepository,
  ) {}

  async criar(usuarioId: number, dto: CriarReservaDto) {
    if (dto.itens.length === 0) {
      throw new BadRequestException('Selecione pelo menos um assento');
    }

    if (dto.itens.length > 10) {
      throw new BadRequestException('Máximo de 10 ingressos por compra');
    }

    const sessao = await this.reservaRepository.buscarSessaoAtiva(dto.sessaoId);
    if (sessao === null) {
      throw new BadRequestException('Sessão inválida ou evento não publicado');
    }

    const assentoIds = dto.itens.map((i) => i.assentoSessaoId);
    const assentos = await this.assentoRepository.buscarPorIds(assentoIds);

    if (assentos.length !== assentoIds.length) {
      throw new BadRequestException('Um ou mais assentos não existem');
    }

    const assentosSessao = assentos.filter((a) => a.sessaoId === dto.sessaoId);
    if (assentosSessao.length !== assentoIds.length) {
      throw new BadRequestException(
        'Um ou mais assentos não pertencem a esta sessão',
      );
    }

    const indisponiveis = assentosSessao.filter(
      (a) => a.status !== 'DISPONIVEL',
    );
    if (indisponiveis.length > 0) {
      throw new ConflictException(
        `Assentos já ocupados: ${indisponiveis.map((a) => `${a.fileira}${a.numero}`).join(', ')}`,
      );
    }

    const duplicados = assentoIds.filter(
      (id, i) => assentoIds.indexOf(id) !== i,
    );
    if (duplicados.length > 0) {
      throw new BadRequestException('Assentos duplicados na seleção');
    }

    const precos = await this.reservaRepository.buscarPrecosCategoria(
      dto.sessaoId,
    );

    const itensComPreco = dto.itens.map((item) => ({
      assentoSessaoId: item.assentoSessaoId,
      categoria: item.categoria,
      precoCentavos: precos.get(item.categoria) ?? 0,
    }));

    return this.reservaRepository.criar(usuarioId, dto.sessaoId, itensComPreco);
  }

  async listar(usuarioId: number) {
    return this.reservaRepository.listarPorUsuario(usuarioId);
  }

  async detalhe(usuarioId: number, reservaId: number) {
    const reserva = await this.reservaRepository.buscarPorId(reservaId);
    if (reserva === null || reserva.usuarioId !== usuarioId) {
      throw new NotFoundException('Reserva não encontrada');
    }
    return reserva;
  }

  async expirarReservas() {
    return this.reservaRepository.expirarReservas();
  }
}
