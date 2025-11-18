import { Chance } from 'chance';
import { Flow } from '../health/flow/schema/flow.schema';
import { Types } from 'mongoose';

const getSampleFlow = (flow?: Partial<Flow>): Flow => {
  const chance = new Chance();

  return {
    createdAt: chance.date().getDate(),
    actions: [],
    inactive: false,
    integrationId: new Types.ObjectId(),
    publishedAt: chance.date().getDate(),
    _id: new Types.ObjectId(),
    ...flow,
  };
};

export { getSampleFlow };
