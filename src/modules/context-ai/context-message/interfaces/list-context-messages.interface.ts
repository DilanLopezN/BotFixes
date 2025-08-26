export interface ListContextMessages {
    startDate: string;
    endDate: string;
    search?: string;
    agentId?: string;
    skip?: number;
    limit?: number;
}

export interface ContextMessagePair {
    referenceId: string;
    userMessage: {
        id: string;
        content: string;
        createdAt: Date;
    };
    systemMessage: {
        id: string;
        content: string;
        createdAt: Date;
    } | null;
}
