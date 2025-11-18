import { EntityType } from '../../interfaces/entity.interface';
import { Types } from 'mongoose';

interface IExternalEntity {
  _id: Types.ObjectId;
  entityType: EntityType;
  deletedAt?: number;
}

export { IExternalEntity };
