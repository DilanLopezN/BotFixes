interface IContextMessage {
    id: string;
    contextId: string;
    content: string;
    role: ContextMessageRole;
    createdAt: Date;
    referenceId: string;
    fromInteractionId?: string;
    workspaceId: string;
    botId?: string;
    completionTokens: number;
    promptTokens: number;
    isFallback: boolean;
}

enum ContextMessageRole {
    'user' = 'user',
    'system' = 'system',
}

export { IContextMessage, ContextMessageRole };
