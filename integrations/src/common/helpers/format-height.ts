export const formatHeight = (input: string | number | null | undefined): number | null => {
  if (input == null) return null;

  let value = String(input).trim().toLowerCase();
  value = value.replace(',', '.');
  value = value.replace(/[^0-9.]/g, '');
  if (!value) return null;

  let height = parseFloat(value);

  if (height > 3) {
    height = height / 100;
  }

  return Math.round(height * 100);
};
