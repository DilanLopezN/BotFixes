export enum ContactTableFilters {
  AllContacts = 'allContacts',
  NotFilled = 'notFilled',
  SentSuccessfully = 'sent',
  SendingFailure = 'sendingFailure',
}

export const defaultVariablesTemplate = [
  'agent.name',
  'conversation.iid',
  'conversation.createdAt',
  'user.name',
  'user.phone',
];
