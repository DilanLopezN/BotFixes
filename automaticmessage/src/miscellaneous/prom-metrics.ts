import * as client from 'prom-client';

export const confirmCounter = new client.Counter({
  name: 'api_confirm_count',
  help: 'metric_help',
  labelNames: ['integration_id'],
});

export const cancelCounter = new client.Counter({
  name: 'api_cancel_count',
  help: 'metric_help',
  labelNames: ['integration_id'],
});
