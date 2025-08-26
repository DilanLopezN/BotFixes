export interface IDistributionRule {
    id?: string;
    workspaceId: string;
    active: boolean;
    maxConversationsPerAgent: number;
    checkUserWasOnConversation?: boolean;
    checkTeamWorkingTimeConversation?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
