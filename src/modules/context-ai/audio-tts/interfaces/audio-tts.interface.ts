export interface IAudioTts {
    id: string;
    name: string;
    cost: number;
    model: string;
    duration: number;
    processingTimeMs: number;
    attachmentId?: string;
    s3Key: string;
    workspaceId: string;
    botId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAudioTts {
    text: string;
    botId: string;
    conversationId: string;
    memberId: string;
    workspaceId: string;
}

export * from './tts-provider.interface';
