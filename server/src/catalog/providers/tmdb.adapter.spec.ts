import { ConfigService } from '@nestjs/config';
import { TmdbAdapter } from './tmdb.adapter';

describe('TmdbAdapter', () => {
  let adapter: TmdbAdapter;

  beforeEach(() => {
    const config = { get: jest.fn() } as unknown as ConfigService;
    adapter = new TmdbAdapter(config);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should throw when search is not implemented', () => {
    expect(() => adapter.search()).toThrow('Not implemented');
  });

  it('should throw when getById is not implemented', () => {
    expect(() => adapter.getById()).toThrow('Not implemented');
  });
});
