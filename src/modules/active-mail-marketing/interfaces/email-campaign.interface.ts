export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

export interface ConversationAttributes {
    [key: string]: any;
}

export interface RecipientAttributes {
    [key: string]: any;
}

export interface EmailSendRequestEvent {
    shortId: string;
    recipientEmail: string;
    emailTemplate: EmailTemplate;
    workspaceId: string;
}

export interface ActiveMessageResponseEvent {
    externalId: string;
    conversationId: string;
    workspaceId: string;
}
