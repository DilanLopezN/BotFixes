export interface FallbackMessage {
    id: string;
    workspaceId: string;
    botId: string | null;
    question: string;
    context: string | null;
    trainingIds: string[];
    createdAt: string;
}

export interface FallbackMessageListResponse {
    data: FallbackMessage[];
    metadata: {
        count: number;
        skip: number;
        limit: number;
    };
}

export interface FallbackMessageListParams {
    startDate: string;
    endDate: string;
    limit: number;
    skip: number;
    agentId: string;
    search?: string;
}

export interface ContextMessage {
    referenceId: string;
    userMessage: {
        id: string;
        content: string;
        createdAt: string;
    };
    systemMessage: {
        id: string;
        content: string;
        createdAt: string;
    };
}

export interface ContextMessageListResponse {
    data: ContextMessage[];
    metadata: {
        count: number;
        skip: number;
        limit: number;
    };
}

export interface ContextMessageListParams {
    startDate: string;
    endDate: string;
    agentId: string;
    limit?: number;
    skip?: number;
    search?: string;
}