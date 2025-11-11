import { doRequest, apiInstance } from '../../../utils/Http';
import { CreateConfirmationSetting, UpdateConfirmationSetting } from '../interfaces/confirmation-setting';
import { CreateReminderSetting, UpdateReminderSetting } from '../interfaces/reminder-setting';
import { CreateScheduleSetting, ScheduleSetting, UpdateScheduleSetting } from '../interfaces/schedule-setting';
import { CreateSendSetting, UpdateSendSetting } from '../interfaces/send-setting';

export const ConfirmationSettingService = {
    listScheduleSetting: async (workspaceId: string): Promise<ScheduleSetting[]> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/schedule-setting`));
    },
    createConfirmationSetting: async (
        workspaceId: string,
        data: {
            schedule: CreateScheduleSetting;
            confirmation: CreateConfirmationSetting;
            reminder: CreateReminderSetting;
            sendSettings: CreateSendSetting[];
        },
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/schedule-setting/create-all-settings`, data),
            undefined,
            errCb
        );
    },
    updateConfirmationSetting: async (
        workspaceId: string,
        scheduleSettingId: number,
        data: {
            confirmation: UpdateConfirmationSetting;
            schedule: UpdateScheduleSetting;
            reminder: UpdateReminderSetting;
            sendSettings?: UpdateSendSetting[];
        },
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(
                `/workspaces/${workspaceId}/schedule-setting/${scheduleSettingId}/update-all-settings`,
                data
            ),
            undefined,
            errCb
        );
    },
    cloneConfirmationSetting: async (
        workspaceId: string,
        originalScheduleSettingId: number,
        newName: string
    ): Promise<any> => {
        const originalSetting = await ConfirmationSettingService.getScheduleSettingAndViculedSettings(
            workspaceId,
            originalScheduleSettingId
        );

        const cloneData = {
            schedule: {
                name: newName,
                alias: originalSetting.alias || '',
                active: false,
                getScheduleInterval: originalSetting.getScheduleInterval ?? 60,
                integrationId: originalSetting.integrationId,
                extractAt: originalSetting.extractAt,
                extractRule: originalSetting.extractRule,
                useSpecialityOnExamMessage: originalSetting.useSpecialityOnExamMessage ?? false,
                sendOnlyPrincipalExam: originalSetting.sendOnlyPrincipalExam ?? false,
                enableSendRetry: originalSetting.enableSendRetry ?? false,
                enableResendNotAnswered: originalSetting.enableResendNotAnswered ?? false,
                useOrganizationUnitOnGroupDescription: originalSetting.useOrganizationUnitOnGroupDescription ?? false,
                omitAppointmentTypeName: originalSetting.omitAppointmentTypeName ?? false,
                omitDoctorName: originalSetting.omitDoctorName ?? false,
                omitExtractGuidance: originalSetting.omitExtractGuidance ?? false,
                fridayJoinWeekendMonday: originalSetting.fridayJoinWeekendMonday ?? false,
                checkScheduleChanges: originalSetting.checkScheduleChanges ?? false,
                omitTimeOnGroupDescription: originalSetting.omitTimeOnGroupDescription ?? false,
                useIsFirstComeFirstServedAsTime: originalSetting.useIsFirstComeFirstServedAsTime ?? false,
                timeResendNotAnswered: originalSetting.timeResendNotAnswered ?? 24,
                useSendFullDay: originalSetting.useSendFullDay ?? false,
                externalExtract: originalSetting.externalExtract ?? false,
            },
            confirmation: {
                active: false,
                apiToken: originalSetting.confirmationSettings?.apiToken || '',
                templateId: originalSetting.confirmationSettings?.templateId || '',
                retryInvalid: originalSetting.confirmationSettings?.retryInvalid ?? false,
                resendMsgNoMatch: originalSetting.confirmationSettings?.resendMsgNoMatch ?? false,
                erpParams: originalSetting.confirmationSettings?.erpParams || '',
                groupRule: originalSetting.confirmationSettings?.groupRule || 'firstOfRange',
                sendRecipientType: originalSetting.confirmationSettings?.sendRecipientType || 'whatsapp',
                emailSendingSettingId: originalSetting.confirmationSettings?.emailSendingSettingId || null,
                sendingGroupType: originalSetting.confirmationSettings?.sendingGroupType || 'individual',
            },
            reminder: {
                active: false,
                apiToken: originalSetting.reminderSettings?.apiToken || '',
                templateId: originalSetting.reminderSettings?.templateId || '',
                sendBeforeScheduleDate: originalSetting.reminderSettings?.sendBeforeScheduleDate ?? 24,
                retryInvalid: originalSetting.reminderSettings?.retryInvalid ?? false,
                erpParams: originalSetting.reminderSettings?.erpParams || '',
                groupRule: originalSetting.reminderSettings?.groupRule || 'firstOfRange',
                sendRecipientType: originalSetting.reminderSettings?.sendRecipientType || 'whatsapp',
                emailSendingSettingId: originalSetting.reminderSettings?.emailSendingSettingId || null,
                sendingGroupType: originalSetting.reminderSettings?.sendingGroupType || 'individual',
            },
            sendSettings:
                originalSetting.sendSettings?.map((sendSetting) => ({
                    active: false,
                    apiToken: sendSetting.apiToken || '',
                    templateId: sendSetting.templateId || '',
                    type: sendSetting.type,
                    erpParams: sendSetting.erpParams || '',
                    retryInvalid: sendSetting.retryInvalid ?? false,
                    resendMsgNoMatch: sendSetting.resendMsgNoMatch ?? false,
                    hoursBeforeScheduleDate: sendSetting.hoursBeforeScheduleDate ?? 48,
                    groupRule: sendSetting.groupRule || 'firstOfRange',
                    sendRecipientType: sendSetting.sendRecipientType || 'whatsapp',
                    emailSendingSettingId: sendSetting.emailSendingSettingId || null,
                    sendingGroupType: sendSetting.sendingGroupType || 'principal',
                })) || [],
        };

        return await ConfirmationSettingService.createConfirmationSetting(workspaceId, cloneData);
    },
    getScheduleSettingAndViculedSettings: async (workspaceId: string, scheduleSettingId: number): Promise<any> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/schedule-setting/${scheduleSettingId}`),
            true
        );
    },
    deleteSendSettingByIdAndWorkspaceId: async (workspaceId: string, sendSettingId: number): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/send-setting/${sendSettingId}`), true);
    },
};
