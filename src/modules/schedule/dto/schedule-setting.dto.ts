export interface CreateScheduleSettingDto {
    getScheduleInterval: number;
    integrationId: string;
    name: string;
    alias?: string;
    active: boolean;
    extractAt: number;
    extractRule: string;
    useSpecialityOnExamMessage?: boolean;
    sendOnlyPrincipalExam?: boolean;
    enableSendRetry?: boolean;
    enableResendNotAnswered?: boolean;
    useOrganizationUnitOnGroupDescription?: boolean;
    omitAppointmentTypeName?: boolean;
    omitExtractGuidance?: boolean;
    fridayJoinWeekendMonday?: boolean;
    checkScheduleChanges?: boolean;
    omitTimeOnGroupDescription?: boolean;
    useIsFirstComeFirstServedAsTime?: boolean;
    timeResendNotAnswered?: number;
    useSendFullDay?: boolean;
    externalExtract?: boolean;
}

export interface UpdateScheduleSettingDto {
    getScheduleInterval: number;
    integrationId: string;
    // active: boolean;
    name: string;
    alias?: string;
    extractAt: number;
    extractRule: string;
    useSpecialityOnExamMessage?: boolean;
    sendOnlyPrincipalExam?: boolean;
    enableSendRetry?: boolean;
    enableResendNotAnswered?: boolean;
    useOrganizationUnitOnGroupDescription?: boolean;
    omitAppointmentTypeName?: boolean;
    omitExtractGuidance?: boolean;
    fridayJoinWeekendMonday?: boolean;
    checkScheduleChanges?: boolean;
    omitTimeOnGroupDescription?: boolean;
    useIsFirstComeFirstServedAsTime?: boolean;
    timeResendNotAnswered?: number;
    useSendFullDay?: boolean;
    externalExtract?: boolean;
}
