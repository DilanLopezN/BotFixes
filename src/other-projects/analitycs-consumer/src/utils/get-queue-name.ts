export const getQueueName = (queueName: string): string => {
    return `ANALYTICS_CONSUMER.${queueName}`;
}