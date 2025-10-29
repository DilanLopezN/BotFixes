export interface UpdateCategorizationParams {
    objectiveId: number;
    outcomeId: number;
    conversationId: string;
    userId: string;
}
export interface UpdateConversationCategorizationProps {
    data: {
        objectiveId: number;
        outcomeId: number;
        userId: string;
        teamId: string;
        updatedAt: string;
        description?: string;
        conversationTags?: string[];
        message?: string;
    };
}
