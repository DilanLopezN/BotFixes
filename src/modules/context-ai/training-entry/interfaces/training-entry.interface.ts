export interface ITrainingEntry {
    id: string;
    identifier: string;
    content: string;
    workspaceId: string;
    pendingTraining: boolean;
    executedTrainingAt: Date;
    agentId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    expiresAt: Date;
}
