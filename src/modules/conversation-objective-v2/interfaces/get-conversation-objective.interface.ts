export interface GetConversationObjectiveParams {
    conversationObjectiveId?: number;
    name?: string;
    status?: ObjectiveStatus;
}

export enum ObjectiveStatus {
    ONLY_DELETED = 'only_deleted',
    ONLY_ACTIVE = 'only_active',
    ALL = 'all',
}
