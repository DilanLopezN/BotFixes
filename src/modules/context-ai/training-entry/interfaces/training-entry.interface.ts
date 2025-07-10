export interface ITrainingEntry {
    id: string;
    identifier: string;
    content: string;
    workspaceId: string;
    botId?: string;
    pendingTraining: boolean;
    executedTrainingAt: Date;
    agentId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
