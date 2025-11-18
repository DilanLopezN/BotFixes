import { Types } from 'mongoose';
import { castObjectId } from './cast-objectid';

export const compareObjectIds = (id1: string | Types.ObjectId, id2: string | Types.ObjectId) => {
  return castObjectId(id1).toHexString() === castObjectId(id2).toHexString();
};
