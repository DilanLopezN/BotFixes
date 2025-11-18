import * as client from 'prom-client';

export const requestsIncomingCounter = new client.Counter({
  name: 'requests_incoming_counter',
  help: 'metric_help',
  labelNames: ['endpoint', 'integrationId'],
});

export const requestsExternalCounter = new client.Counter({
  name: 'requests_external_counter',
  help: 'metric_help',
  labelNames: ['integration'],
});

export const apiMsgLatency = new client.Histogram({
  name: 'integration_api_msg_latency',
  help: 'metric_help',
  labelNames: ['endpoint', 'integrationId'],
});

export const createdSchedulesCounter = new client.Counter({
  name: 'created_schedules_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const externalHttpRequestsTotal = new client.Counter({
  name: 'external_http_requests_total',
  help: 'metric_help',
  labelNames: ['integration', 'statusCode'],
});

export const pingSuccessExternalHttpRequests = new client.Counter({
  name: 'ping_success_external_http_requests',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const pingErrorExternalHttpRequests = new client.Counter({
  name: 'ping_error_external_http_requests',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationConfirmCounter = new client.Counter({
  name: 'confirmation_confirm_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationEmailConfirmCounter = new client.Counter({
  name: 'confirmation_email_confirm_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationEmailCancelCounter = new client.Counter({
  name: 'confirmation_email_cancel_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationConfirmSuccessCounter = new client.Counter({
  name: 'confirmation_confirm_success_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationConfirmErrorCounter = new client.Counter({
  name: 'confirmation_confirm_error_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationCancelCounter = new client.Counter({
  name: 'confirmation_cancel_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationCancelSuccessCounter = new client.Counter({
  name: 'confirmation_cancel_success_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const confirmationCancelErrorCounter = new client.Counter({
  name: 'confirmation_cancel_error_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const botdesignerEconnresetCounter = new client.Counter({
  name: 'botdesigner_econnreset_counter',
  help: 'metric_help',
  labelNames: [],
});

export const botdesignerEconnresetResolvedCounter = new client.Counter({
  name: 'botdesigner_econnreset_resolved_counter',
  help: 'metric_help',
  labelNames: [],
});

export const botConfirmRequestCounter = new client.Counter({
  name: 'bot_confirm_request_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const botConfirmRequestErrorCounter = new client.Counter({
  name: 'bot_confirm_request_error_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const botConfirmRequestDoneCounter = new client.Counter({
  name: 'bot_confirm_request_done_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const botCancelRequestCounter = new client.Counter({
  name: 'bot_cancel_request_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const botCancelRequestErrorCounter = new client.Counter({
  name: 'bot_cancel_request_error_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const botCancelRequestDoneCounter = new client.Counter({
  name: 'bot_cancel_request_done_counter',
  help: 'metric_help',
  labelNames: ['integrationId', 'integration_name', 'integration_type'],
});

export const entityListRequestCounter = new client.Counter({
  name: 'entity_list_request_counter',
  help: 'metric_help',
  labelNames: ['integration_name', 'integration_type', 'entity_type', 'state'],
});
