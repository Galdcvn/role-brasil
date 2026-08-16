import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoriaIngresso, ReservaStatus } from '@prisma/client';
import { CatalogService } from '../catalog/catalog.service';
import { AtualizarEventoDto } from './dto/atualizar-evento.dto';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { EventoRepository } from './evento.repository';

export interface ReservaMetrica {
  sessaoId: number;
  status: ReservaStatus;
  subtotalCentavos: number;
  ingressos: { categoria: CategoriaIngresso }[];
}

export interface DadosMetricas {
  reservasTotais: number;
  reservasPorSessao: { sessaoId: number; dataHora: Date; total: number }[];
  valorArrecadado: number;
  valorArrecadadoPorSessao: {
    sessaoId: number;
    dataHora: Date;
    total: number;
  }[];
  ingressosPorCategoria: Record<CategoriaIngresso, number>;
  ingressosPorCategoriaPorSessao: {
    sessaoId: number;
    dataHora: Date;
    porCategoria: Record<CategoriaIngresso, number>;
  }[];
}

const ZERAR_CATEGORIAS = (): Record<CategoriaIngresso, number> => ({
  INTEIRA: 0,
  MEIA: 0,
  GRATUIDADE: 0,
});

@Injectable()
export class EventoService {
  constructor(
    private readonly eventoRepository: EventoRepository,
    private readonly catalogService: CatalogService,
  ) {}

  async criar(organizadorId: number, dto: CriarEventoDto) {
    let titulo = dto.titulo;
    let descricao = dto.descricao;
    let posterUrl = dto.posterUrl;

    if (dto.tmdbId !== undefined) {
      const filme = await this.catalogService.detalharFilme(dto.tmdbId);
      if (filme === null) {
        throw new BadRequestException('Filme não encontrado no catálogo');
      }
      titulo = titulo ?? filme.titulo;
      descricao = descricao ?? filme.descricao;
      posterUrl = posterUrl ?? filme.posterUrl;
    }

    try {
      return await this.eventoRepository.criar(organizadorId, {
        tmdbId: dto.tmdbId,
        titulo: titulo ?? '',
        descricao,
        posterUrl,
        telefoneSuporte: dto.telefoneSuporte,
        emailSuporte: dto.emailSuporte,
        endereco: dto.endereco,
        categorias: dto.categorias,
      });
    } catch (erro) {
      if (this.ehConflitoCategoria(erro)) {
        throw new BadRequestException('Categorias duplicadas');
      }
      throw erro;
    }
  }

  async listar(organizadorId: number) {
    return this.eventoRepository.listarDoOrganizador(organizadorId);
  }

  async detalhe(organizadorId: number, id: number) {
    const evento = await this.eventoRepository.buscarDoOrganizador(
      organizadorId,
      id,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }
    const reservas = await this.eventoRepository.buscarReservas(evento.id);
    const metricas = this.montarMetricas(reservas, evento.sessoes);
    return { ...evento, metricas };
  }

  async atualizar(organizadorId: number, id: number, dto: AtualizarEventoDto) {
    const evento = await this.eventoRepository.buscarDoOrganizador(
      organizadorId,
      id,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }

    const temReservas = (await this.eventoRepository.contarReservas(id)) > 0;
    if (temReservas) {
      const camposEditaveisComReservas: (keyof AtualizarEventoDto)[] = [
        'titulo',
        'posterUrl',
        'telefoneSuporte',
        'emailSuporte',
        'endereco',
        'categorias',
      ];
      const camposNaoPermitidos = camposEditaveisComReservas.filter(
        (campo) => dto[campo] !== undefined,
      );
      if (camposNaoPermitidos.length > 0) {
        throw new ConflictException(
          'Evento com reservas só permite editar a descrição',
        );
      }
    }

    try {
      return await this.eventoRepository.atualizar(id, {
        titulo: dto.titulo,
        descricao: dto.descricao,
        posterUrl: dto.posterUrl,
        telefoneSuporte: dto.telefoneSuporte,
        emailSuporte: dto.emailSuporte,
        endereco: dto.endereco,
        categorias: dto.categorias,
      });
    } catch (erro) {
      if (this.ehConflitoCategoria(erro)) {
        throw new BadRequestException('Categorias duplicadas');
      }
      throw erro;
    }
  }

  async excluir(organizadorId: number, id: number) {
    const evento = await this.eventoRepository.buscarDoOrganizador(
      organizadorId,
      id,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }
    const temReservas = (await this.eventoRepository.contarReservas(id)) > 0;
    if (temReservas) {
      throw new ConflictException(
        'Evento com reservas não pode ser excluído; cancele-o',
      );
    }
    return this.eventoRepository.softDelete(id);
  }

  async cancelar(organizadorId: number, id: number) {
    const evento = await this.eventoRepository.buscarDoOrganizador(
      organizadorId,
      id,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }
    return this.eventoRepository.cancelar(id);
  }

  async publicar(organizadorId: number, id: number) {
    const evento = await this.eventoRepository.buscarDoOrganizador(
      organizadorId,
      id,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }
    if (evento.status === 'CANCELADO') {
      throw new ConflictException('Evento cancelado não pode ser publicado');
    }
    return this.eventoRepository.publicar(id);
  }

  private montarMetricas(
    reservas: ReservaMetrica[],
    sessoes: { id: number; dataHora: Date }[],
  ): DadosMetricas {
    const porSessao = new Map<number, number>();
    const arrecadadoPorSessao = new Map<number, number>();
    const ingressosPorCategoria = ZERAR_CATEGORIAS();
    const ingressosPorSessao = new Map<
      number,
      Record<CategoriaIngresso, number>
    >();
    let valorArrecadado = 0;

    for (const reserva of reservas) {
      porSessao.set(
        reserva.sessaoId,
        (porSessao.get(reserva.sessaoId) ?? 0) + 1,
      );

      if (reserva.status === 'PAGO') {
        valorArrecadado += reserva.subtotalCentavos;
        arrecadadoPorSessao.set(
          reserva.sessaoId,
          (arrecadadoPorSessao.get(reserva.sessaoId) ?? 0) +
            reserva.subtotalCentavos,
        );
      }

      for (const ingresso of reserva.ingressos) {
        ingressosPorCategoria[ingresso.categoria] += 1;
        const porCategoria = ingressosPorSessao.get(reserva.sessaoId) ?? {
          ...ZERAR_CATEGORIAS(),
        };
        porCategoria[ingresso.categoria] += 1;
        ingressosPorSessao.set(reserva.sessaoId, porCategoria);
      }
    }

    return {
      reservasTotais: reservas.length,
      reservasPorSessao: sessoes.map((sessao) => ({
        sessaoId: sessao.id,
        dataHora: sessao.dataHora,
        total: porSessao.get(sessao.id) ?? 0,
      })),
      valorArrecadado,
      valorArrecadadoPorSessao: sessoes.map((sessao) => ({
        sessaoId: sessao.id,
        dataHora: sessao.dataHora,
        total: arrecadadoPorSessao.get(sessao.id) ?? 0,
      })),
      ingressosPorCategoria,
      ingressosPorCategoriaPorSessao: sessoes.map((sessao) => ({
        sessaoId: sessao.id,
        dataHora: sessao.dataHora,
        porCategoria: ingressosPorSessao.get(sessao.id) ?? {
          ...ZERAR_CATEGORIAS(),
        },
      })),
    };
  }

  private ehConflitoCategoria(erro: unknown): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === 'P2002'
    );
  }
}
