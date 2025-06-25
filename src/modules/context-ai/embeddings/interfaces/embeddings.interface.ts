export interface Embeddings {
    id: string;
    content: string;
    embedding: number[];
    workspaceId: string;
    trainingEntryId: string;
    totalTokens: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
