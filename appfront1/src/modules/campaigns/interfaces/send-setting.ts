import { RecipientType, ScheduleGroupRule } from "./confirmation-setting";

export enum ExtractResumeType {
    confirmation = 'confirmation',
    reminder = 'reminder',
    nps = 'nps', //Net Promoter Score / Pesquisa de satisfação - apenas envio do link de NPS do cliente
    medical_report = 'medical_report',
    schedule_notification = 'schedule_notification',
    recover_lost_schedule = 'recover_lost_schedule', // Recuperação de agendamentos perdidos
    nps_score = 'nps_score', //Net Promoter Score - NPS
    documents_request = 'documents_request', // Solicitação de documento
    active_mkt = 'active_mkt', // Envio dinamico de Marketing ativo
}

export interface SendSetting {
    id: number;
    type: ExtractResumeType;
    templateId: string;
    active: boolean;
    apiToken: string;
    workspaceId: string;
    hoursBeforeScheduleDate?: number;
    scheduleSettingId: number;
    retryInvalid?: boolean
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: RecipientType;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface CreateSendSetting {
    active: boolean;
    type: ExtractResumeType;
    templateId: string;
    apiToken: string;
    hoursBeforeScheduleDate?: number;
    scheduleSettingId?: number;
    retryInvalid?: boolean
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: RecipientType;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateSendSetting extends SendSetting{}
