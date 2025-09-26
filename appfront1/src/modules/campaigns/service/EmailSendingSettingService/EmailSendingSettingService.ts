import { doRequest, apiInstance } from '../../../../utils/Http';
import { CreateEmailSendingSettingDto, EmailSendingSetting, UpdateEmailSendingSettingDto } from './interface'

export const EmailSendingSettingService = {
    listEmailSendingSetting: async (workspaceId: string): Promise<EmailSendingSetting[]> => {
        return await doRequest(apiInstance.get(`/email-setting/workspaces/${workspaceId}/list`));
    },
    createEmailSendingSetting: async (
        workspaceId: string,
        data: CreateEmailSendingSettingDto,
        errCb?
    ): Promise<EmailSendingSetting> => {
        return await doRequest(
            apiInstance.post(`/email-setting/workspaces/${workspaceId}/create`, data),
            undefined,
            errCb
        );
    },
    updateEmailSendingSetting: async (
        workspaceId: string,
        emailSendingSettingId: number,
        data: UpdateEmailSendingSettingDto,
        errCb?
    ): Promise<EmailSendingSetting> => {
        return await doRequest(
            apiInstance.put(`/email-setting/workspaces/${workspaceId}/id/${emailSendingSettingId}`, data),
            undefined,
            errCb
        );
    },
    getEmailSendingSettingById: async (workspaceId: string, emailSendingSettingId: number): Promise<EmailSendingSetting> => {
        return await doRequest(apiInstance.get(`/email-setting/workspaces/${workspaceId}/id/${emailSendingSettingId}`), true);
    },
    deleteEmailSendingSetting: async (workspaceId: string, emailSendingSettingId: number): Promise<{ ok: boolean }> => {
        return await doRequest(apiInstance.delete(`/email-setting/workspaces/${workspaceId}/id/${emailSendingSettingId}`), true);
    },
    getTemplatesSendGrid: async (): Promise<any[]> => {
        return await doRequest(apiInstance.get(`/email/templates/`), true);
    },
    getTemplateSendGridById: async (templateId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/email/templates/${templateId}`), true);
    },
};
