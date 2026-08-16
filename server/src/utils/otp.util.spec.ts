import { gerarCodigoOtp } from './otp.util';

describe('gerarCodigoOtp', () => {
  it('gera um código de 6 dígitos no intervalo válido', () => {
    const codigo = gerarCodigoOtp();
    expect(codigo).toBeGreaterThanOrEqual(100000);
    expect(codigo).toBeLessThanOrEqual(999999);
    expect(Number.isInteger(codigo)).toBe(true);
  });

  it('gera códigos variados', () => {
    const codigos = new Set(Array.from({ length: 100 }, gerarCodigoOtp));
    expect(codigos.size).toBeGreaterThan(1);
  });
});
