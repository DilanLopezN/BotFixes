import { ValueTransformer } from 'typeorm';

export const bigint: ValueTransformer = {
  to: (entityValue: number) => entityValue?.toString(),
  from: (databaseValue: string): number | string => {
    if (databaseValue) {
      return parseInt(databaseValue, 10);
    }

    return databaseValue;
  },
};
