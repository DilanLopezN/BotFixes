interface IContextMessage {
    id: string;
    contextId: string;
    content: string;
    nextStep: Record<string, any> | null;
    role: ContextMessageRole;
    createdAt: Date;
    referenceId: string;
    fromInteractionId?: string;
    workspaceId: string;
    agentId: string;
    completionTokens: number;
    promptTokens: number;
    modelName: string;
    isFallback: boolean;
    type: ContextMessageType;
}

enum ContextMessageType {
    message = 'message',
    rewrite = 'rewrite',
}

enum ContextMessageRole {
    'user' = 'user',
    'system' = 'system',
}

export { IContextMessage, ContextMessageRole, ContextMessageType };
