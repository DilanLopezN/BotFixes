import { IContextMessage } from './context-message.interface';

export type CreateContextMessage = Omit<IContextMessage, 'id' | 'createdAt'>;
