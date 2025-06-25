import { Conversation } from '../../conversation/interfaces/conversation.interface';

export interface GetConversationIdByScheduleMessageUuidListRequest {
    uuidList: string[];
    workspaceId: string;
}

export interface GetConversationByIdRequest {
    conversationId: string;
}

export interface DispatchMessageActivityRequest {
    conversation: Conversation;
    activity: any;
}

export interface GetTemplateByIdRequest {
    templateId: string;
}

export interface GetParsedTemplateRequest {
    templateId: string;
    values: { key: string; value: string }[];
}

export interface GetTemplateVariableKeysRequest {
    templateId: string;
    values: { key: string; value: string }[];
}

export interface GetEmailSendingSettingByWorkspaceIdAndIdRequest {
    workspaceId: string;
    emailSendingSettingId: number;
}

export interface GetEmailTemplateVariableKeysRequest {
    templateId: string;
    versionId: string;
}

export interface GetEmailTemplateByVersionRequest {
    templateId: string;
    versionId: string;
}
