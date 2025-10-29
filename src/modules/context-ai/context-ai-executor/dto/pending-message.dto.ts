export interface PendingMessage {
    messageId: string;
    text: string;
    workspaceId: string;
    contextId: string;
    fromAudio?: boolean;
    fromInteractionId?: string;
    botId?: string;
    parameters?: Record<string, any>;
    timestamp: Date;
}