interface IContextFallbackMessage {
    id: string;
    question: string;
    context: string;
    trainingIds: string[];
    createdAt: Date;
    workspaceId: string;
    botId?: string;
}

export { IContextFallbackMessage };
