export interface SendTemplateFileData {
    workspaceId: string;
    conversationId: string;
    templateId: string;
    memberId: string;
    attributes?: string[];
    message?: string;
}