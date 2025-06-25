export interface CreateEmbedding {
    embedding?: number[];
    totalTokens?: number;
    trainingEntryId: string;
    workspaceId: string;
    content: string;
}
