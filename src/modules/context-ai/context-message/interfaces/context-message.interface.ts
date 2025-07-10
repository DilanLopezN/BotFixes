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
    botId?: string;
    agentId: string;
    completionTokens: number;
    promptTokens: number;
    isFallback: boolean;
}

enum ContextMessageRole {
    'user' = 'user',
    'system' = 'system',
}

export { IContextMessage, ContextMessageRole };
