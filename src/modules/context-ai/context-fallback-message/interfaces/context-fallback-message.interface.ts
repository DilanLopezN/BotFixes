interface IContextFallbackMessage {
    id: string;
    question: string;
    createdAt: Date;
    workspaceId: string;
    botId?: string;
}

export { IContextFallbackMessage };
