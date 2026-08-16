import { ConfigService } from '@nestjs/config';
import { TmdbAdapter } from './tmdb.adapter';

describe('TmdbAdapter', () => {
  let adapter: TmdbAdapter;
  let fetchMock: jest.Mock;

  const resposta = (status: number, corpo: unknown) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: () => corpo,
    }) as Response;

  const configComChave = (chave?: string) =>
    ({
      get: (k: string) => (k === 'TMDB_API_KEY' ? chave : undefined),
    }) as unknown as ConfigService;

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
    adapter = new TmdbAdapter(configComChave('chave-teste'));
  });

  describe('search', () => {
    it('busca e normaliza os filmes do TMDb', async () => {
      fetchMock.mockResolvedValue(
        resposta(200, {
          results: [
            {
              id: 550,
              title: 'Fight Club',
              overview: 'Um clube de luta.',
              poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
              release_date: '1999-10-15',
            },
            {
              id: 552,
              title: 'Sem Pôster',
              overview: null,
              poster_path: null,
              release_date: null,
            },
          ],
        }),
      );

      const filmes = await adapter.search('fight club');

      const chamadas = fetchMock.mock.calls as unknown as {
        0: string;
        1: RequestInit;
      }[];
      expect(chamadas[0][0]).toContain('/search/movie');
      expect(chamadas[0][0]).toContain('query=fight%20club');
      expect(chamadas[0][0]).toContain('api_key=chave-teste');
      expect(chamadas[0][1].signal).toBeInstanceOf(AbortSignal);
      expect(filmes).toEqual([
        {
          id: 550,
          titulo: 'Fight Club',
          descricao: 'Um clube de luta.',
          posterUrl:
            'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          ano: 1999,
        },
        {
          id: 552,
          titulo: 'Sem Pôster',
          descricao: '',
          posterUrl: '',
          ano: 0,
        },
      ]);
    });

    it('retorna lista vazia quando não há resultados', async () => {
      fetchMock.mockResolvedValue(resposta(200, { results: [] }));

      const filmes = await adapter.search('xyz');

      expect(filmes).toEqual([]);
    });

    it('trata ano inválido como 0', async () => {
      fetchMock.mockResolvedValue(
        resposta(200, {
          results: [
            {
              id: 1,
              title: 'Filme',
              overview: '',
              poster_path: null,
              release_date: 'data-invalida',
            },
          ],
        }),
      );

      const filmes = await adapter.search('filme');

      expect(filmes[0]?.ano).toBe(0);
    });
  });

  describe('getById', () => {
    it('retorna o filme normalizado', async () => {
      fetchMock.mockResolvedValue(
        resposta(200, {
          id: 550,
          title: 'Fight Club',
          overview: 'desc',
          poster_path: '/p.jpg',
          release_date: '1999-10-15',
        }),
      );

      const filme = await adapter.getById(550);

      expect(filme).toEqual({
        id: 550,
        titulo: 'Fight Club',
        descricao: 'desc',
        posterUrl: 'https://image.tmdb.org/t/p/w500/p.jpg',
        ano: 1999,
      });
    });

    it('retorna null quando o filme não existe (404)', async () => {
      fetchMock.mockResolvedValue(resposta(404, {}));

      const filme = await adapter.getById(999999);

      expect(filme).toBeNull();
    });
  });

  it('lança erro quando a API responde com erro', async () => {
    fetchMock.mockResolvedValue(resposta(500, {}));

    await expect(adapter.search('filme')).rejects.toThrow('TMDb respondeu 500');
  });

  it('lança erro quando a chave não está configurada', async () => {
    adapter = new TmdbAdapter(configComChave(undefined));

    await expect(adapter.search('filme')).rejects.toThrow(
      'TMDB_API_KEY não configurada',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
