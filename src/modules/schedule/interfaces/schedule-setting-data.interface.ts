
export interface CreateScheduleSettingData {
    getScheduleInterval: number;
    workspaceId: string;
    integrationId: string;
    name: string;
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

export interface UpdateScheduleSettingData {
    getScheduleInterval: number;
    integrationId: string;
    active: boolean;
    name: string;
    id: number;
    workspaceId: string;
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
