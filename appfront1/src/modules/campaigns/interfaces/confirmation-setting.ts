import { ExtractRule } from './schedule-setting';
import { ExtractResumeType } from './send-setting';

export enum ManyScheduleBehaviorType {
    CONFIRM_ALL = 'CONFIRM_ALL',
    CONFIRM_ONE = 'CONFIRM_ONE',
    SEQUENTIAL_CONFIRM = 'SEQUENTIAL_CONFIRM',
}

export enum ScheduleGroupRule {
    firstOfRange = 'firstOfRange',
    allOfRange = 'allOfRange',
}

export enum RecipientType {
    email = 'email',
    whatsapp = 'whatsapp',
}

export interface ConfirmationSetting {
    id: number;
    templateId: string;
    active: boolean;
    apiToken: string;
    workspaceId: string;

    scheduleSettingId: number;
    saveScheduleRetryCount: number; //Quantas vezes deve tentar salvar a resposta do paciente no integrations
    manyScheduleBehavior: ManyScheduleBehaviorType; //O que deve fazer quando tem mais de um agendamento no dia. Confirmar todos com uma mensagem, confirmar apenas o primeiro, confirmar um depois da resposta do paciente confirmar outro e assim até acabar todos
    sendWhatsBeforeScheduleDate?: number; // Quantas horas antes da data do agendamento deve enviar o email
    sendEmailBeforeScheduleDate?: number; // Quantas horas antes da data do agendamento deve enviar o email
    timeToSendWhatsAfterEmail: number; // Em minutos
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    createdAt?: Date;
}

export interface CreateConfirmationSetting {
    templateId: string;
    apiToken: string;
    sendWhatsBeforeScheduleDate?: number;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    active: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendRecipientType?: RecipientType;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateConfirmationSetting {
    id: number;
    workspaceId: string;
    templateId: string;
    apiToken: string;
    active: boolean;
    scheduleSettingId: number;
    sendWhatsBeforeScheduleDate?: number;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendRecipientType?: RecipientType;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface ConfirmationSettingFormDto {
    confirmation: {
        id?: number;
        active: boolean;
        templateId: string;
        apiToken: string;
        scheduleSettingId?: number;
        sendWhatsBeforeScheduleDate?: number;
        retryInvalid?: boolean;
        resendMsgNoMatch?: boolean;
        erpParams?: string;
        groupRule?: ScheduleGroupRule;
        sendRecipientType?: RecipientType;
        emailSendingSettingId?: number;
        sendingGroupType?: string;
    };
    schedule: {
        id?: number;
        name: string;
        active: boolean;
        integrationId: string;
        getScheduleInterval: number;
        apiKey?: string;
        extractRule: ExtractRule;
        extractAt: number;
        useSpecialityOnExamMessage?: boolean;
        sendOnlyPrincipalExam?: boolean;
        enableSendRetry?: boolean;
        enableResendNotAnswered?: boolean;
        useOrganizationUnitOnGroupDescription?: boolean;
        omitAppointmentTypeName?: boolean;
        omitDoctorName?: boolean;
        omitExtractGuidance?: boolean;
        fridayJoinWeekendMonday?: boolean;
        useIsFirstComeFirstServedAsTime?: boolean;
        checkScheduleChanges?: boolean;
        omitTimeOnGroupDescription?: boolean;
        timeResendNotAnswered?: number;
        useSendFullDay?: boolean;
        externalExtract?: boolean;
        buildDescriptionWithAddress?: boolean;
    };
    reminder: {
        id?: number;
        active: boolean;
        templateId: string;
        apiToken: string;
        sendBeforeScheduleDate?: number;
        scheduleSettingId?: number;
        retryInvalid?: boolean;
        erpParams?: string;
        groupRule?: ScheduleGroupRule;
        sendAction?: boolean;
        sendRecipientType?: RecipientType;
        emailSendingSettingId?: number;
        sendingGroupType?: string;
    };
    sendSettings?: {
        id?: number;
        active: boolean;
        type: ExtractResumeType;
        templateId: string;
        apiToken: string;
        hoursBeforeScheduleDate?: number;
        scheduleSettingId?: number;
        retryInvalid?: boolean;
        resendMsgNoMatch?: boolean;
        erpParams?: string;
        groupRule?: ScheduleGroupRule;
        sendAction?: boolean;
        sendRecipientType?: RecipientType;
        emailSendingSettingId?: number;
        sendingGroupType?: string;
    }[];
}
