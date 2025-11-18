import { formatCurrency } from '../format-currency';

describe('FUNC:formatCurrency', () => {
  it('format BRL', () => {
    const value = 30.0;
    const formatted = formatCurrency(value, 2);
    expect(formatted).toEqual('30,00');
  });

  it('format BRL 3 digits', () => {
    const value = 1500;
    const formatted = formatCurrency(value, 3);
    expect(formatted).toEqual('1.500,000');
  });
});
