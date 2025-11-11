export enum ExtractRule {
    DEFAULT = 'DEFAULT',
    DAILY = 'DAILY',
    DAILYV2 = 'DAILYV2',
    HOURLY = 'HOURLY',
}
export interface ScheduleSetting {
    id: number;
    name: string;
    alias?: string;
    getScheduleInterval: number; //Determina de qt em qt tempo deve buscar agendamentos do integrations em minutos
    workspaceId: string;
    integrationId: string;
    extractAt: number;
    extractRule: ExtractRule;
    active: true;
    apiKey: string;
    useSpecialityOnExamMessage?: boolean;
    enableSendRetry?: boolean;
    enableResendNotAnswered?: boolean;
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
    createdAt: Date;
}

export interface CreateScheduleSetting {
    getScheduleInterval: number;
    integrationId: string;
    name: string;
    alias?: string;
    active: boolean;
    extractAt: number;
    extractRule: ExtractRule;
    useSpecialityOnExamMessage?: boolean;
    sendOnlyPrincipalExam?: boolean;
    enableSendRetry?: boolean;
    enableResendNotAnswered?: boolean;
    omitAppointmentTypeName?: boolean;
    omitDoctorName?: boolean;
    omitExtractGuidance?: boolean;
    fridayJoinWeekendMonday?: boolean;
    useIsFirstComeFirstServedAsTime?: boolean;
    useOrganizationUnitOnGroupDescription?: boolean;
    checkScheduleChanges?: boolean;
    omitTimeOnGroupDescription?: boolean;
    timeResendNotAnswered?: number;
    useSendFullDay?: boolean;
    externalExtract?: boolean;
    buildDescriptionWithAddress?: boolean;
}

export interface UpdateScheduleSetting extends CreateScheduleSetting {
    id: number;
    workspaceId: string;
    active: boolean;
    name: string;
}
