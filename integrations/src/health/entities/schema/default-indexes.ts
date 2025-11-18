import { IndexDefinition } from 'mongoose';

export const defaultIndex: IndexDefinition = {
  integrationId: 1,
  code: 1,
  order: -1,
  friendlyName: 1,
  canView: 1,
  canSchedule: 1,
};
