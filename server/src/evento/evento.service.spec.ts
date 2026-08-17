import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CatalogService } from '../catalog/catalog.service';
import { AtualizarEventoDto } from './dto/atualizar-evento.dto';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { EventoRepository } from './evento.repository';
import { EventoService } from './evento.service';

describe('EventoService', () => {
  let service: EventoService;
  let repositoryMock: {
    criar: jest.Mock;
    buscarDoOrganizador: jest.Mock;
    listarDoOrganizador: jest.Mock;
    atualizar: jest.Mock;
    softDelete: jest.Mock;
    cancelar: jest.Mock;
    publicar: jest.Mock;
    contarReservas: jest.Mock;
    buscarReservas: jest.Mock;
    listarPublicos: jest.Mock;
    buscarPublico: jest.Mock;
  };
  let catalogMock: { detalharFilme: jest.Mock; buscarFilmes: jest.Mock };

  const eventoBase = {
    id: 1,
    organizadorId: 7,
    status: 'RASCUNHO',
    titulo: 'Filme A',
    descricao: 'desc',
    posterUrl: null,
    telefoneSuporte: null,
    emailSuporte: null,
    tmdbId: null,
    criadoEm: new Date('2026-08-01T00:00:00Z'),
    atualizadoEm: new Date('2026-08-01T00:00:00Z'),
    endereco: null,
    categorias: [],
  };

  beforeEach(() => {
    repositoryMock = {
      criar: jest.fn(),
      buscarDoOrganizador: jest.fn(),
      listarDoOrganizador: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
      cancelar: jest.fn(),
      publicar: jest.fn(),
      contarReservas: jest.fn(),
      buscarReservas: jest.fn(),
      listarPublicos: jest.fn(),
      buscarPublico: jest.fn(),
    };
    catalogMock = {
      detalharFilme: jest.fn(),
      buscarFilmes: jest.fn(),
    };
    service = new EventoService(
      repositoryMock as unknown as EventoRepository,
      catalogMock as unknown as CatalogService,
    );
  });

  describe('criar', () => {
    it('cria direto com título quando não há tmdbId', async () => {
      repositoryMock.criar.mockResolvedValue({ id: 1 });
      const dto = new CriarEventoDto();
      dto.titulo = 'Meu Filme';
      dto.categorias = [{ nome: 'INTEIRA', precoCentavos: 2000 }];
      await service.criar(7, dto);
      expect(catalogMock.detalharFilme).not.toHaveBeenCalled();
      expect(repositoryMock.criar).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ titulo: 'Meu Filme' }) as object,
      );
    });

    it('preenche o snapshot do filme quando tmdbId é informado', async () => {
      repositoryMock.criar.mockResolvedValue({ id: 1 });
      catalogMock.detalharFilme.mockResolvedValue({
        id: 42,
        titulo: 'Filme do TMDB',
        descricao: 'Sinopse',
        posterUrl: 'https://img/filme.jpg',
        ano: 2024,
      });
      const dto = new CriarEventoDto();
      dto.tmdbId = 42;
      dto.categorias = [{ nome: 'INTEIRA', precoCentavos: 2000 }];
      await service.criar(7, dto);
      expect(repositoryMock.criar).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          tmdbId: 42,
          titulo: 'Filme do TMDB',
          descricao: 'Sinopse',
          posterUrl: 'https://img/filme.jpg',
        }) as object,
      );
    });

    it('mantém título informado mesmo com tmdbId', async () => {
      repositoryMock.criar.mockResolvedValue({ id: 1 });
      catalogMock.detalharFilme.mockResolvedValue({
        id: 42,
        titulo: 'Filme do TMDB',
        descricao: 'Sinopse',
        posterUrl: null,
        ano: 2024,
      });
      const dto = new CriarEventoDto();
      dto.tmdbId = 42;
      dto.titulo = 'Sessão Especial';
      dto.categorias = [{ nome: 'INTEIRA', precoCentavos: 2000 }];
      await service.criar(7, dto);
      expect(repositoryMock.criar).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ titulo: 'Sessão Especial' }) as object,
      );
    });

    it('rejeita quando o filme não existe no catálogo', async () => {
      catalogMock.detalharFilme.mockResolvedValue(null);
      const dto = new CriarEventoDto();
      dto.tmdbId = 999;
      dto.categorias = [{ nome: 'INTEIRA', precoCentavos: 2000 }];
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
      expect(repositoryMock.criar).not.toHaveBeenCalled();
    });

    it('traduz conflito de categoria duplicada para BadRequest', async () => {
      repositoryMock.criar.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('', {
          code: 'P2002',
          clientVersion: '6.19.3',
        }),
      );
      const dto = new CriarEventoDto();
      dto.titulo = 'X';
      dto.categorias = [
        { nome: 'INTEIRA', precoCentavos: 2000 },
        { nome: 'INTEIRA', precoCentavos: 1500 },
      ];
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('listar', () => {
    it('repassa a listagem do organizador', async () => {
      repositoryMock.listarDoOrganizador.mockResolvedValue([{ id: 1 }]);
      const resultado = await service.listar(7);
      expect(repositoryMock.listarDoOrganizador).toHaveBeenCalledWith(7);
      expect(resultado).toEqual([{ id: 1 }]);
    });
  });

  describe('detalhe', () => {
    it('lança NotFound quando o evento não é do organizador', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(null);
      await expect(service.detalhe(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('monta as métricas a partir das reservas e sessões', async () => {
      const sessao1 = { id: 1, dataHora: new Date('2026-08-10T20:00:00Z') };
      const sessao2 = { id: 2, dataHora: new Date('2026-08-11T20:00:00Z') };
      repositoryMock.buscarDoOrganizador.mockResolvedValue({
        ...eventoBase,
        sessoes: [sessao1, sessao2],
      });
      repositoryMock.buscarReservas.mockResolvedValue([
        {
          sessaoId: 1,
          status: 'PAGO',
          subtotalCentavos: 3000,
          ingressos: [{ categoria: 'INTEIRA' }, { categoria: 'MEIA' }],
        },
        {
          sessaoId: 1,
          status: 'PENDENTE',
          subtotalCentavos: 0,
          ingressos: [{ categoria: 'GRATUIDADE' }],
        },
        {
          sessaoId: 2,
          status: 'PAGO',
          subtotalCentavos: 2000,
          ingressos: [{ categoria: 'INTEIRA' }],
        },
      ]);
      const resultado = await service.detalhe(7, 1);
      expect(resultado.metricas).toEqual({
        reservasTotais: 3,
        reservasPorSessao: [
          { sessaoId: 1, dataHora: sessao1.dataHora, total: 2 },
          { sessaoId: 2, dataHora: sessao2.dataHora, total: 1 },
        ],
        valorArrecadado: 5000,
        valorArrecadadoPorSessao: [
          { sessaoId: 1, dataHora: sessao1.dataHora, total: 3000 },
          { sessaoId: 2, dataHora: sessao2.dataHora, total: 2000 },
        ],
        ingressosPorCategoria: { INTEIRA: 2, MEIA: 1, GRATUIDADE: 1 },
        ingressosPorCategoriaPorSessao: [
          {
            sessaoId: 1,
            dataHora: sessao1.dataHora,
            porCategoria: { INTEIRA: 1, MEIA: 1, GRATUIDADE: 1 },
          },
          {
            sessaoId: 2,
            dataHora: sessao2.dataHora,
            porCategoria: { INTEIRA: 1, MEIA: 0, GRATUIDADE: 0 },
          },
        ],
      });
    });
  });

  describe('atualizar', () => {
    it('atualiza normalmente quando não há reservas', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.contarReservas.mockResolvedValue(0);
      repositoryMock.atualizar.mockResolvedValue({ id: 1 });
      const dto = new AtualizarEventoDto();
      dto.titulo = 'Novo';
      await service.atualizar(7, 1, dto);
      expect(repositoryMock.atualizar).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ titulo: 'Novo' }) as object,
      );
    });

    it('permite só descrição quando há reservas', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.contarReservas.mockResolvedValue(2);
      repositoryMock.atualizar.mockResolvedValue({ id: 1 });
      const dto = new AtualizarEventoDto();
      dto.descricao = 'Nova descrição';
      await service.atualizar(7, 1, dto);
      expect(repositoryMock.atualizar).toHaveBeenCalled();
    });

    it('bloqueia outros campos quando há reservas', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.contarReservas.mockResolvedValue(2);
      const dto = new AtualizarEventoDto();
      dto.titulo = 'Novo';
      dto.descricao = 'Nova descrição';
      await expect(service.atualizar(7, 1, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(repositoryMock.atualizar).not.toHaveBeenCalled();
    });

    it('lança NotFound para evento de outro organizador', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(null);
      const dto = new AtualizarEventoDto();
      dto.titulo = 'Novo';
      await expect(service.atualizar(7, 1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('traduz categorias duplicadas na atualização', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.contarReservas.mockResolvedValue(0);
      repositoryMock.atualizar.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('', {
          code: 'P2002',
          clientVersion: '6.19.3',
        }),
      );
      const dto = new AtualizarEventoDto();
      dto.categorias = [
        { nome: 'MEIA', precoCentavos: 1000 },
        { nome: 'MEIA', precoCentavos: 800 },
      ];
      await expect(service.atualizar(7, 1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('excluir', () => {
    it('soft deleta quando não há reservas', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.contarReservas.mockResolvedValue(0);
      repositoryMock.softDelete.mockResolvedValue({ id: 1 });
      await service.excluir(7, 1);
      expect(repositoryMock.softDelete).toHaveBeenCalledWith(1);
    });

    it('bloqueia exclusão quando há reservas', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.contarReservas.mockResolvedValue(1);
      await expect(service.excluir(7, 1)).rejects.toThrow(ConflictException);
      expect(repositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it('lança NotFound quando o evento não existe', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(null);
      await expect(service.excluir(7, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelar', () => {
    it('cancela o evento do organizador', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.cancelar.mockResolvedValue({ id: 1 });
      await service.cancelar(7, 1);
      expect(repositoryMock.cancelar).toHaveBeenCalledWith(1);
    });

    it('lança NotFound quando o evento não existe', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(null);
      await expect(service.cancelar(7, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('publicar', () => {
    it('publica o evento do organizador', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(eventoBase);
      repositoryMock.publicar.mockResolvedValue({ id: 1 });
      await service.publicar(7, 1);
      expect(repositoryMock.publicar).toHaveBeenCalledWith(1);
    });

    it('lança NotFound quando o evento não existe', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue(null);
      await expect(service.publicar(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('bloqueia publicação de evento cancelado', async () => {
      repositoryMock.buscarDoOrganizador.mockResolvedValue({
        ...eventoBase,
        status: 'CANCELADO',
      });
      await expect(service.publicar(7, 1)).rejects.toThrow(ConflictException);
      expect(repositoryMock.publicar).not.toHaveBeenCalled();
    });
  });

  describe('listarPublicos', () => {
    it('repassa filtros ao repository', async () => {
      repositoryMock.listarPublicos.mockResolvedValue({
        eventos: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      const resultado = await service.listarPublicos({
        busca: 'festa',
        precoMin: 1000,
      });
      expect(repositoryMock.listarPublicos).toHaveBeenCalledWith({
        busca: 'festa',
        precoMin: 1000,
      });
      expect(resultado.eventos).toEqual([]);
    });
  });

  describe('detalhePublico', () => {
    it('lança NotFoundException quando evento não existe', async () => {
      repositoryMock.buscarPublico.mockResolvedValue(null);
      await expect(service.detalhePublico(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna o evento quando encontrado', async () => {
      repositoryMock.buscarPublico.mockResolvedValue({
        id: 1,
        titulo: 'Festa',
      });
      const resultado = await service.detalhePublico(1);
      expect(repositoryMock.buscarPublico).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ id: 1, titulo: 'Festa' });
    });
  });
});
