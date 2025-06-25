export interface CreateAudioTranscriptionData {
    workspaceId: string;
    createdBy: string;
    urlFile: string;
    conversationId?: string;
    externalId?: string;
}
