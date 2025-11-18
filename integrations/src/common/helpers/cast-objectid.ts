import { Types } from 'mongoose';

export const castObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
};

export const castObjectIdToString = (id: string | Types.ObjectId): string => {
  if (typeof id === 'string') {
    return id;
  }

  return id?.toHexString?.() || (id as unknown as string);
};
