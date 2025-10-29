export interface ActiveMessageCreatedEvent {
    externalId: string;
    conversationId: string;
    workspaceId?: string;
    phoneNumber?: string;
    [key: string]: any;
}
