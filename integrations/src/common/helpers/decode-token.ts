import * as jwt from 'jsonwebtoken';

export const decodeToken = <T>(token: string, secretKey: string) => {
  try {
    const decoded = jwt.verify(String(token).replace('Bearer', '').trim(), secretKey);
    return decoded as T;
  } catch (error) {
    return null;
  }
};
