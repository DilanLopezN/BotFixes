export interface GetConversationOutcomeParams {
    conversationOutcomeId?: number;
    name?: string;
    status?: OutcomeStatus;
}

export enum OutcomeStatus {
    ONLY_DELETED = 'only_deleted',
    ONLY_ACTIVE = 'only_active',
    ALL = 'all',
}
