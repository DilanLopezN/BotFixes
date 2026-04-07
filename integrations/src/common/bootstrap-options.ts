export enum StartType {
  http = 'http',
  internal = 'internal',
  batch = 'batch',
}

export const shouldStartRabbit = () => process.env.NODE_ENV == 'local' || process.env.START_TYPE === StartType.batch;
export const shouldRunCron = () => process.env.NODE_ENV == 'local' || process.env.START_TYPE === StartType.batch;
export const shouldStartInternalApi = () =>
  process.env.NODE_ENV == 'local' || process.env.START_TYPE === StartType.internal;
