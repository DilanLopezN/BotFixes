export const normalizeText = (text?: string | number) => {
  if (text === undefined) {
    return '';
  }

  return String(text)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};
