import { SendTemplateFileData } from './../interfaces/send-template-file.interface';
export class SendFileTemplateDto implements Omit<SendTemplateFileData, 'workspaceId' | 'conversationId'> {
    templateId: string;
    memberId: string;
    attributes?: string[];
    message?: string;
}