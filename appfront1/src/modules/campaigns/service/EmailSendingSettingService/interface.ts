export interface EmailSendingSetting {
    id?: number;
    enabled: boolean;
    settingName: string;
    workspaceId: string;
    templateId: string;
    versionId: string;
    emailType: EmailType,
    templateVariables?: Record<string, string>;
    createdAt: string;
}

export interface CreateEmailSendingSettingDto extends Omit<EmailSendingSetting, 'id' | 'createdAt' | 'workspaceId'> {
    enabled: boolean;
    settingName: string;
    templateId: string;
    versionId: string;
    emailType: EmailType,
    templateVariables?: Record<string, string>;
}

export interface UpdateEmailSendingSettingDto extends Omit<EmailSendingSetting, 'id' | 'createdAt' | 'workspaceId'> {
    enabled: boolean;
    settingName: string;
    templateId: string;
    versionId: string;
    emailType: EmailType,
    templateVariables?: Record<string, string>;
}

export enum EmailType {
    simple = 'simple',
    invite = 'invite',
}
