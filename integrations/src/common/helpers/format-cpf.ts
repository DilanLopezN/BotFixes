export const formatCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const onlyNumbers = (value: string) => value?.replace(/\D/g, '');
