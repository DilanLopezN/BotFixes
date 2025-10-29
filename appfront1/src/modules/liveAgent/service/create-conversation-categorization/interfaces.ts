export interface CreateConversationCategorizationProps {
data: {
    conversationId: string;
    objectiveId: string;
    outcomeId: string;
    userId: string;
    description?: string;
    conversationTags?: string[];
    message?: string;
    };
}
