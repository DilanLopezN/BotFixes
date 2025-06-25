import * as client from 'prom-client';


export const rabbitMsgCounter = new client.Counter({
    name: 'rabbit_msg_count',
    help: 'metric_help',
    labelNames: ['Queue']
});

export const rabbitMsgCounterError = new client.Counter({
    name: 'rabbit_msg_error_count',
    help: 'metric_help',
    labelNames: ['Queue']
});

export const rabbitMsgLatency = new client.Histogram({
    name: 'rabbit_msg_latency',
    help: 'metric_help',
    labelNames: ['Queue']
});

export const apiSendMessageIncomingCounter = new client.Counter({
    name: 'api_send_message_incoming',
    help: 'metric_help',
    labelNames: ['api_token']
});

export const apiSendMessageCreatedCounter = new client.Counter({
    name: 'api_send_message_created',
    help: 'metric_help',
    labelNames: ['api_token']
});

export const conversationSearchLatency = new client.Histogram({
    name: 'conversation_search_latency',
    help: 'metric_help',
    labelNames: ['workspace_id']
});

export const userAccessLatency = new client.Histogram({
    name: 'user_access_latency',
    help: 'metric_help',
    labelNames: ['user_id', 'op', 'workspace_id']
});

export const errorCounter = new client.Counter({
    name: 'api_error_count',
    help: 'metric_help',
    labelNames: ['location']
});

export const confirmCounter = new client.Counter({
    name: 'api_confirm_count',
    help: 'metric_help',
    labelNames: ['integration_id']
});

export const cancelCounter = new client.Counter({
    name: 'api_cancel_count',
    help: 'metric_help',
    labelNames: ['integration_id']
});

export const ackProcessLatencyLocation = new client.Histogram({
    name: 'ack_process_latency_location',
    help: 'metric_help',
    labelNames: ['Func'],
});
