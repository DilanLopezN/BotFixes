import * as crypto from 'crypto';

export const generateRandomHash = (size: number): string => {
  return crypto.randomBytes(size / 2).toString('hex');
};
