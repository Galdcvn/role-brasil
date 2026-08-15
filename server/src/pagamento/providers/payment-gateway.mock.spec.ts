import { PaymentGatewayMock } from './payment-gateway.mock';

describe('PaymentGatewayMock', () => {
  it('should be defined', () => {
    expect(new PaymentGatewayMock()).toBeDefined();
  });
});
