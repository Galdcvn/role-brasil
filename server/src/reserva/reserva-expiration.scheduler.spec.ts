import { ReservaExpirationScheduler } from './reserva-expiration.scheduler';
import { ReservaService } from './reserva.service';

describe('ReservaExpirationScheduler', () => {
  let scheduler: ReservaExpirationScheduler;
  let serviceMock: { expirarReservas: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    serviceMock = { expirarReservas: jest.fn().mockResolvedValue(0) };
    scheduler = new ReservaExpirationScheduler(
      serviceMock as unknown as ReservaService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('inicia o intervalo no onModuleInit', () => {
    scheduler.onModuleInit();
    expect(serviceMock.expirarReservas).not.toHaveBeenCalled();
    jest.advanceTimersByTime(60_000);
    expect(serviceMock.expirarReservas).toHaveBeenCalledTimes(1);
  });

  it('limpa o intervalo no onModuleDestroy', () => {
    scheduler.onModuleInit();
    scheduler.onModuleDestroy();
    jest.advanceTimersByTime(60_000);
    expect(serviceMock.expirarReservas).not.toHaveBeenCalled();
  });

  it('onModuleDestroy sem timer não lança erro', () => {
    expect(() => scheduler.onModuleDestroy()).not.toThrow();
  });

  it('continua funcionando se expirarReservas rejeitar', () => {
    serviceMock.expirarReservas.mockRejectedValueOnce(new Error('db'));
    scheduler.onModuleInit();
    jest.advanceTimersByTime(60_000);
    expect(serviceMock.expirarReservas).toHaveBeenCalledTimes(1);
    serviceMock.expirarReservas.mockResolvedValue(0);
    jest.advanceTimersByTime(60_000);
    expect(serviceMock.expirarReservas).toHaveBeenCalledTimes(2);
  });
});
