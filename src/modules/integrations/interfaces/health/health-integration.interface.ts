import { Document, Types } from 'mongoose';
import { HealthEntityType, HealthIntegrationSynchronizeStatus } from 'kissbot-core';

export interface IHealthIntegration {
    name: string;
    entitiesToSync: string[];
    entitiesFlow: string[];
    showExternalEntities?: string[];
    workspaceId: Types.ObjectId;
    syncStatus: HealthIntegrationSynchronizeStatus;
    syncErrorStatus: HealthIntegrationSynchronizeStatus;
    lastSyncTimestamp: number;
    lastSyncErrorTimestamp: number;
    enabled: boolean;
    //campo que salva a data que as entidades foram buscadas do ERP
    lastSyncEntities: number;
    //campo que salva a data da última publicação da entidade
    lastSinglePublishEntities?: { [key in HealthEntityType]?: number };
    rules: { [key in IntegrationRules]: any };
    environment?: IntegrationEnvironment;
    type: IntegrationType;
    syncType: IntegrationSyncType;
    debug?: boolean;
    auditRequests?: boolean;
    internalApi?: IntegrationInternalApi;
    lastPublishFlow?: number;
    lastPublishFlowDraft?: number;
    routines?: Routines;
    deletedAt?: number;
}

export interface Routines {
    cronSearchAvailableSchedules?: boolean;
}

export interface IntegrationInternalApi {
    url: string;
    token: string;
    methods: {
        listAvailableExams: boolean;
    };
}

export enum IntegrationEnvironment {
    production = 'production',
    test = 'test',
}

export enum IntegrationType {
    CM = 'CM',
    DOCTORALIA = 'DOCTORALIA',
    NETPACS = 'NETPACS',
    TDSA = 'TDSA',
    FEEGOW = 'FEEGOW',
    SAO_MARCOS = 'SAO_MARCOS',
    CLINUX = 'CLINUX',
    SUPORTE_INFORMATICA = 'SUPORTE_INFORMATICA',
    CUSTOM_IMPORT = 'CUSTOM_IMPORT',
    MANAGER = 'MANAGER',
    BOTDESIGNER = 'BOTDESIGNER',
    DR_MOBILE = 'DR_MOBILE',
    MATRIX = 'MATRIX',
    AMIGO = 'AMIGO',
    KAYSER = 'KAYSER',
}

export enum IntegrationRules {
    listOnlyDoctorsWithAvailableSchedules = 'listOnlyDoctorsWithAvailableSchedules',
    listConsultationTypesAsProcedure = 'listConsultationTypesAsProcedure',
    requiredTypeOfServiceOnCreateAppointment = 'requiredTypeOfServiceOnCreateAppointment',
    useProcedureWithoutSpecialityRelation = 'useProcedureWithoutSpecialityRelation',
    useProcedureAsInterAppointmentValidation = 'useProcedureAsInterAppointmentValidation',
    useProcedureWithCompositeCode = 'useProcedureWithCompositeCode',
    useOccupationAreaAsInterAppointmentValidation = 'useOccupationAreaAsInterAppointmentValidation',
    useDoctorAsInterAppointmentValidation = 'useDoctorAsInterAppointmentValidation',
    sendGuidanceOnCreateSchedule = 'sendGuidanceOnCreateSchedule',
    sendObservationOnListSchedules = 'sendObservationOnListSchedules',
    splitInsuranceIntoInsurancePlans = 'splitInsuranceIntoInsurancePlans',
    splitInsuranceIntoInsurancePlansV2 = 'splitInsuranceIntoInsurancePlansV2',
    updatePatientEmailBeforeCreateSchedule = 'updatePatientEmailBeforeCreateSchedule',
    updatePatientSexBeforeCreateSchedule = 'updatePatientSexBeforeCreateSchedule',
    updatePatientPhoneBeforeCreateSchedule = 'updatePatientPhoneBeforeCreateSchedule',
    showFutureSearchInAvailableScheduleList = 'showFutureSearchInAvailableScheduleList',
    timeBeforeTheAppointmentThatConfirmationCanBeMade = 'timeBeforeTheAppointmentThatConfirmationCanBeMade',
    showListingFutureTimesFrom = 'showListingFutureTimesFrom',
    runFirstScheduleRule = 'runFirstScheduleRule',
    timeCacheFirstAppointmentAvailableForFutureSearches = 'timeCacheFirstAppointmentAvailableForFutureSearches',
    limitUntilDaySearchAppointments = 'limitUntilDaySearchAppointments',
    limitUntilDaySearchAppointmentsWithDoctor = 'limitUntilDaySearchAppointmentsWithDoctor',
    runInterAppointment = 'runInterAppointment',
    limitDaysForListDoctorsWithAvailableSchedules = 'limitDaysForListDoctorsWithAvailableSchedules',
    timeFirstAvailableSchedule = 'timeFirstAvailableSchedule',
    showAnotherDoctorInTheListOfAvailableAppointments = 'showAnotherDoctorInTheListOfAvailableAppointments',
    listAvailableAppointmentFromAllActiveUnits = 'listAvailableAppointmentFromAllActiveUnits',
    usesNightTimeInTheSelectionOfPeriod = 'usesNightTimeInTheSelectionOfPeriod',
    limitOfDaysToSplitRequestInScheduleSearch = 'limitOfDaysToSplitRequestInScheduleSearch',
    doNotAllowSameDayScheduling = 'doNotAllowSameDayScheduling',
    doNotAllowSameDayAndDoctorScheduling = 'doNotAllowSameDayAndDoctorScheduling',
    doNotAllowSameDayAndProcedureScheduling = 'doNotAllowSameDayAndProcedureScheduling',
    doNotAllowSameHourScheduling = 'doNotAllowSameHourScheduling',
    minutesAfterAppointmentCanSchedule = 'minutesAfterAppointmentCanSchedule',
    useInsuranceSuggestion = 'useInsuranceSuggestion',
    useDoctorSuggestion = 'useDoctorSuggestion',
    patientNameCase = 'patientNameCase',
    allowStepBack = 'allowStepBack',
    useListInAllSteps = 'useListInAllSteps',
}

export enum IntegrationSyncType {
    daily = 'daily',
    weekly = 'weekly',
}

export enum IntegrationPatientNameCase {
    UPPER = 'UPPER',
    LOWER = 'LOWER',
    CAPITALIZE = 'CAPITALIZE',
    NONE = 'NONE',
}

export interface HealthIntegration extends IHealthIntegration, Document {}
