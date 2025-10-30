import { HealthEntitySource, HealthEntityType, HealthIntegrationSynchronizeStatus } from 'kissbot-core';

export interface HealthIntegrationRules {
    doNotAllowSameDayScheduling?: boolean;
    doNotAllowSameDayAndDoctorScheduling?: boolean;
    doNotAllowSameDayAndProcedureScheduling?: boolean;
    listOnlyDoctorsWithAvailableSchedules?: boolean;
    requiredTypeOfServiceOnCreateAppointment?: boolean;
    useProcedureWithoutSpecialityRelation?: boolean;
    useProcedureAsInterAppointmentValidation?: boolean;
    useProcedureWithCompositeCode?: boolean;
    useOccupationAreaAsInterAppointmentValidation?: boolean;
    useDoctorAsInterAppointmentValidation?: boolean;
    sendGuidanceOnCreateSchedule?: boolean;
    sendObservationOnListSchedules?: boolean;
    splitInsuranceIntoInsurancePlans?: boolean;
    splitInsuranceIntoInsurancePlansV2?: boolean;
    updatePatientEmailBeforeCreateSchedule?: boolean;
    updatePatientSexBeforeCreateSchedule?: boolean;
    updatePatientPhoneBeforeCreateSchedule?: boolean;
    usesCorrelation?: boolean;
    showFutureSearchInAvailableScheduleList?: boolean;
    timeBeforeTheAppointmentThatConfirmationCanBeMade?: number;
    timeCacheFirstAppointmentAvailableForFutureSearches?: number;
    limitUntilDaySearchAppointments?: number;
    limitUntilDaySearchAppointmentsWithDoctor?: number;
    showListingFutureTimesFrom?: number;
    runFirstScheduleRule?: boolean;
    runInterAppointment?: boolean;
    timeFirstAvailableSchedule?: number;
    listAvailableAppointmentFromAllActiveUnits?: boolean;
    limitDaysForListDoctorsWithAvailableSchedules?: number;
    showAnotherDoctorInTheListOfAvailableAppointments?: boolean;
    usesNightTimeInTheSelectionOfPeriod?: boolean;
    limitOfDaysToSplitRequestInScheduleSearch?: number;
    useInsuranceSuggestion?: boolean;
    useScheduleSuggestion?: boolean;
    useReportProcessorAISpecialityAndProcedureDetection?: boolean;
    useReportProcessorAIProcedureDetection?: boolean;
    useDoctorSuggestion?: boolean;
    listConsultationTypesAsProcedure?: boolean;
    useScheduledSending?: boolean;
    useNetpacsGroupedSchedules?: boolean;
    useNetpacsDoctorByProcedure?: boolean;
    allowStepBack?: boolean;
    patientNameCase?: IntegrationPatientNameCase;
    useListInAllSteps?: boolean;
}

export interface HealthIntegrationLastSinglePublishEntities {
    [HealthEntityType.appointmentType]?: number;
    [HealthEntityType.doctor]?: number;
    [HealthEntityType.group]?: number;
    [HealthEntityType.insurance]?: number;
    [HealthEntityType.insurancePlan]?: number;
    [HealthEntityType.insuranceSubPlan]?: number;
    [HealthEntityType.organizationUnit]?: number;
    [HealthEntityType.planCategory]?: number;
    [HealthEntityType.procedure]?: number;
    [HealthEntityType.speciality]?: number;
    [HealthEntityType.occupationArea]?: number;
    [HealthEntityType.organizationUnitLocation]?: number;
    [HealthEntityType.typeOfService]?: number;
    [HealthEntityType.laterality]?: number;
}

export enum IntegrationEnvironment {
    production = 'production',
    test = 'test',
}

export enum IntegrationSyncType {
    daily = 'daily',
    weekly = 'weekly',
}

export enum IntegrationsType {
    DOCTORALIA = 'DOCTORALIA',
    CM = 'CM',
    NETPACS = 'NETPACS',
    TDSA = 'TDSA',
    SAO_MARCOS = 'SAO_MARCOS',
    FEEGOW = 'FEEGOW',
    CLINUX = 'CLINUX',
    SUPORTE_INFORMATICA = 'SUPORTE_INFORMATICA',
    CUSTOM_IMPORT = 'CUSTOM_IMPORT',
    MANAGER = 'MANAGER',
    BOTDESIGNER = 'BOTDESIGNER',
    BOTDESIGNER_FAKE = 'BOTDESIGNER_FAKE',
    DR_MOBILE = 'DR_MOBILE',
    CLINIC = 'CLINIC',
    MATRIX = 'MATRIX',
    AMIGO = 'AMIGO',
    KAYSER = 'KAYSER',
}

export interface DocumentsConfiguration {
    enableDocumentsUpload: boolean;
    documentsMaxSizeInMb: number;
}

export interface HealthIntegration {
    _id?: string;
    name: string;
    codeIntegration: string;
    entitiesToSync: HealthEntityType[];
    entitiesFlow: HealthEntityType[];
    type: string;
    apiToken?: string;
    showExternalEntities?: HealthEntityType[];
    workspaceId: string;
    syncStatus?: HealthIntegrationSynchronizeStatus;
    syncErrorStatus?: HealthIntegrationSynchronizeStatus;
    lastSyncTimestamp?: number;
    lastSyncErrorTimestamp?: number;
    enabled: boolean;
    requiredAuthentication: boolean;
    lastSyncEntities?: number;
    lastPublishFlow?: number;
    lastPublishFlowDraft?: number;
    lastSinglePublishEntities?: HealthIntegrationLastSinglePublishEntities;
    rules?: HealthIntegrationRules;
    environment?: IntegrationEnvironment;
    syncType?: IntegrationSyncType;
    debug?: boolean;
    auditRequests?: boolean;
    apiUsername?: string;
    apiPassword?: string;
    routines?: {
        cronSearchAvailableSchedules?: boolean;
    };
    integrationStatus?: any;
    newMessagesCount?: any;
    messages?: any;
    scheduling?: Scheduling;
    documents?: DocumentsConfiguration;
}

export interface HealthEntity {
    _id: string;
    iid: string;
    code: string;
    name: string;
    friendlyName: string;
    synonyms: string[];
    version: string;
    lastUpdate: number;
    specialityType: string;
    specialityCode?: string;
    workspaceId: string;
    integrationId: string;
    order?: number;
    source: HealthEntitySource;
    entityType: HealthEntityType;
    parent?: HealthEntity;
    insuranceCode: string;
    interConsultationPeriod?: number;
    activeErp?: boolean;
    draft?: HealthEntity;
    references?: IEntityReference[];
    params?: any;
    canCancel?: boolean;
    canConfirmActive?: boolean;
    canConfirmPassive?: boolean;
    canView?: boolean;
    canReschedule?: boolean;
    canSchedule?: boolean;
}

export interface IEntityReference {
    refId: string;
    type: HealthEntityType;
}

export enum IntegrationPatientNameCase {
    UPPER = 'UPPER',
    LOWER = 'LOWER',
    CAPITALIZE = 'CAPITALIZE',
    NONE = 'NONE',
}

export enum SchedulingGuidanceFormat {
    file = 'file',
    rawText = 'rawText',
}

export interface Scheduling {
    active: boolean;
    identifier: string;
    guidanceFormatType: SchedulingGuidanceFormat;
    createScheduleNotification: boolean;
    createSchedulingLinkAfterCreateSchedule: boolean;
    config?: {
        name?: string;
        friendlyName?: string;
        logo?: string;
        whatsapp?: {
            phoneNumber?: string;
            startSchedulingMessage?: string;
            startReschedulingMessage?: string;
        };
        resources?: {
            cancellation?: {
                enableScheduleCancellation?: boolean;
                hoursBeforeAppointmentToAllowCancellation?: number;
            };
            confirmation?: {
                enableScheduleConfirmation?: boolean;
                hoursBeforeAppointmentToAllowConfirmation?: number;
            };
            rescheduling?: {
                enableScheduleRescheduling?: boolean;
                hoursBeforeAppointmentToAllowRescheduling?: number;
            };
        };
        documents?: {
            enableDocumentsUpload?: boolean;
            documentsMaxSizeInMb?: number;
            suporteMessage?: string;
        };
    };
}
