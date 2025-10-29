export interface EmailPayload {
    to: string;
    fromEmail?: string;
    fromTitle: string;
    workspaceId: string;
    externalId: string;
    templateId: string;
    templateData: Record<string, any>;
}
