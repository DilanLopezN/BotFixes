export interface CreateTrainingEntry {
    identifier: string;
    content: string;
    agentId: string;
    trainingEntryTypeId?: string;
    expiresAt?: string;
    isActive?: boolean;
}
