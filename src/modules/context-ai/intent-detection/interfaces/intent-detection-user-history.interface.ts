export interface IIntentDetectionUserHistory {
    id: string;
    workspaceId: string;
    agentId: string | null;
    inputText: string;
    detectedIntentId: string | null;
    detected: boolean;
    promptTokens: number;
    completionTokens: number;
    actionsReturned: string[] | null;
    contextId?: string;
    fromInteractionId?: string;
    createdAt: Date;
}

export interface CreateIntentDetectionUserHistoryData {
    workspaceId: string;
    agentId: string | null;
    inputText: string;
    detectedIntentId: string | null;
    detected: boolean;
    promptTokens: number;
    completionTokens: number;
    actionsReturned: string[] | null;
    contextId?: string;
    fromInteractionId?: string;
}

export interface ListIntentDetectionUserHistoryFilter {
    workspaceId?: string;
    agentId?: string;
    detected?: boolean;
    startDate?: Date;
    endDate?: Date;
}
