export const getQueueName = (queue: string): string => {
  return `INTEGRATIONS.${queue}`;
};
