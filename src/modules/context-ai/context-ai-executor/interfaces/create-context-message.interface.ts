import { IContextMessage } from '../../context-message/interfaces/context-message.interface';

export type CreateContextMessage = Pick<
    IContextMessage,
    | 'content'
    | 'workspaceId'
    | 'role'
    | 'referenceId'
    | 'completionTokens'
    | 'promptTokens'
    | 'fromInteractionId'
    | 'isFallback'
>;
