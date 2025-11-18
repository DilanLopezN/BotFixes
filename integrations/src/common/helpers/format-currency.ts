export const formatCurrency = (value: string | number, digits: number = 2) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    throw new Error('Invalid');
  }

  const formattedValue = numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    style: 'currency',
    currency: 'BRL',
    currencyDisplay: 'code',
  });

  return formattedValue.replace('BRL', '').trim();
};
