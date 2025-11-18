import { formatCPF } from '../format-cpf';

describe('FUNC:formatCpf', () => {
  it('format valid CPF', () => {
    const cpf = '31172756066';
    const formatted = formatCPF(cpf);
    expect(formatted).toEqual('311.727.560-66');
  });

  it('format invalid CPF', () => {
    const cpf = '111111111';
    const formatted = formatCPF(cpf);
    expect(formatted).toEqual('111111111');
  });
});
