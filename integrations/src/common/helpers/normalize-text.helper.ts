import { deburr } from 'lodash';

export const normalize = (text: string, upper?: boolean) => {
  const value = text.split(' ').join(' ');
  return upper ? value.toUpperCase() : value;
};

export const removeAccents = (text: string) => deburr(text);
