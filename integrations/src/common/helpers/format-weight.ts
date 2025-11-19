export const formatWeight = (input: string | number | null | undefined): number | null => {
  if (input == null) return null;

  let value = String(input).trim().toLowerCase();
  value = value.replace(',', '.');
  value = value.replace(/[^0-9.]/g, '');
  if (!value) return null;

  const weight = parseFloat(value);
  if (isNaN(weight)) return null;

  return Math.trunc(weight);
};
