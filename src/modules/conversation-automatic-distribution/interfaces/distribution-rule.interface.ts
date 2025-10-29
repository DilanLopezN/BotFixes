export interface IDistributionRule {
    id?: string;
    workspaceId: string;
    active: boolean;
    maxConversationsPerAgent: number;
    checkUserWasOnConversation?: boolean;
    checkTeamWorkingTimeConversation?: boolean;
    excludedUserIds?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
