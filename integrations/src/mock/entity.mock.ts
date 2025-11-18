import { Chance } from 'chance';
import { Types } from 'mongoose';
import { EntitySourceType, EntityVersionType } from '../health/interfaces/entity.interface';

const getSampleEntity = <T>(entity?: Partial<T>): T => {
  const chance = new Chance();

  return {
    createdAt: chance.date().getDate(),
    integrationId: new Types.ObjectId(),
    code: chance.string({ length: 3 }),
    name: chance.name({ full: true }),
    friendlyName: chance.name({ full: true }),
    version: EntityVersionType.production,
    source: EntitySourceType.erp,
    activeErp: true,
    canView: true,
    canCancel: true,
    canConfirmActive: true,
    canConfirmPassive: true,
    canReschedule: true,
    canSchedule: true,
    ...entity,
  } as T;
};

export { getSampleEntity };
