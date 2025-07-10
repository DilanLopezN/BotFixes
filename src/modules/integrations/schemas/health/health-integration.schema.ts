import * as mongoose from 'mongoose';
import {
    HealthIntegration,
    IntegrationEnvironment,
    IntegrationPatientNameCase,
    IntegrationSyncType,
} from '../../interfaces/health/health-integration.interface';
import { HealthEntityType, HealthIntegrationSynchronizeStatus } from 'kissbot-core';
import { AfterFindSoftDeletePlugin } from '../../../../common/mongoosePlugins/afterFindSoftDelete.plugin';

const HealthIntegrationRules = new mongoose.Schema(
    {
        listOnlyDoctorsWithAvailableSchedules: {
            type: Boolean,
            required: false,
            default: true,
        },
        listConsultationTypesAsProcedure: {
            type: Boolean,
            required: false,
            default: false,
        },
        requiredTypeOfServiceOnCreateAppointment: {
            type: Boolean,
            required: false,
            default: false,
        },
        useProcedureWithoutSpecialityRelation: {
            type: Boolean,
            required: false,
            default: false,
        },
        useProcedureAsInterAppointmentValidation: {
            type: Boolean,
            required: false,
            default: false,
        },
        useProcedureWithCompositeCode: {
            type: Boolean,
            required: false,
            default: false,
        },
        useOccupationAreaAsInterAppointmentValidation: {
            type: Boolean,
            required: false,
            default: false,
        },
        useDoctorAsInterAppointmentValidation: {
            type: Boolean,
            required: false,
            default: false,
        },
        sendGuidanceOnCreateSchedule: {
            type: Boolean,
            required: false,
            default: false,
        },
        sendObservationOnListSchedules: {
            type: Boolean,
            required: false,
            default: false,
        },
        splitInsuranceIntoInsurancePlans: {
            type: Boolean,
            required: false,
            default: false,
        },
        splitInsuranceIntoInsurancePlansV2: {
            type: Boolean,
            required: false,
            default: false,
        },
        updatePatientEmailBeforeCreateSchedule: {
            type: Boolean,
            required: false,
            default: true,
        },
        updatePatientSexBeforeCreateSchedule: {
            type: Boolean,
            required: false,
            default: false,
        },
        updatePatientPhoneBeforeCreateSchedule: {
            type: Boolean,
            required: false,
            default: true,
        },
        showFutureSearchInAvailableScheduleList: {
            type: Boolean,
            required: false,
            default: true,
        },
        timeBeforeTheAppointmentThatConfirmationCanBeMade: {
            type: Number,
            required: false,
        },
        showListingFutureTimesFrom: {
            type: Number,
            required: false,
        },
        runFirstScheduleRule: {
            type: Boolean,
            default: false,
        },
        timeCacheFirstAppointmentAvailableForFutureSearches: {
            type: Number,
            required: false,
        },
        limitUntilDaySearchAppointments: {
            type: Number,
            required: false,
        },
        runInterAppointment: {
            type: Boolean,
            default: true,
        },
        timeFirstAvailableSchedule: {
            type: Number,
            required: false,
        },
        limitDaysForListDoctorsWithAvailableSchedules: {
            type: Number,
            required: false,
        },
        limitUntilDaySearchAppointmentsWithDoctor: {
            type: Number,
            required: false,
        },
        showAnotherDoctorInTheListOfAvailableAppointments: {
            type: Boolean,
            default: true,
        },
        listAvailableAppointmentFromAllActiveUnits: {
            type: Boolean,
            default: false,
        },
        usesNightTimeInTheSelectionOfPeriod: {
            type: Boolean,
            default: false,
        },
        limitOfDaysToSplitRequestInScheduleSearch: {
            type: Number,
            required: false,
        },
        doNotAllowSameDayScheduling: {
            type: Boolean,
            default: false,
        },
        doNotAllowSameDayAndDoctorScheduling: {
            type: Boolean,
            default: false,
        },
        doNotAllowSameDayAndProcedureScheduling: {
            type: Boolean,
            default: false,
        },
        doNotAllowSameHourScheduling: {
            type: Boolean,
            default: false,
        },
        minutesAfterAppointmentCanSchedule: {
            type: Number,
            required: false,
        },
        useInsuranceSuggestion: {
            type: Boolean,
            default: false,
        },
        useReportProcessorAISpecialityAndProcedureDetection: {
            type: Boolean,
            default: false,
        },
        useReportProcessorAIProcedureDetection: {
            type: Boolean,
            default: false,
        },
        useDoctorSuggestion: {
            type: Boolean,
            default: false,
        },
        useClinuxApiV2: {
            type: Boolean,
            default: false,
        },
        useNetpacsGroupedSchedules: {
            type: Boolean,
            default: false,
        },
        useNetpacsDoctorByProcedure: {
            type: Boolean,
            default: false,
        },
        doNotCancelBefore24hours: {
            type: Boolean,
            default: false,
        },
        useFeegowFilterDoctorsByInsurance: {
            type: Boolean,
            default: false,
        },
        useScheduledSending: {
            type: Boolean,
            default: false,
        },
        getPatientDoctorAttended: {
            type: Boolean,
            default: false,
        },
        patientNameCase: {
            type: String,
            enum: [...Object.values(IntegrationPatientNameCase)],
        },
        allowStepBack: {
            type: Boolean,
            default: false,
        },
        useListInAllSteps: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false, versionKey: false },
);

const HealthIntegrationLastSinglePublishEntities = new mongoose.Schema(
    {
        [HealthEntityType.appointmentType]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.doctor]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.group]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.insurance]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.insurancePlan]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.insuranceSubPlan]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.organizationUnit]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.planCategory]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.procedure]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.speciality]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.occupationArea]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.organizationUnitLocation]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.typeOfService]: {
            type: Number,
            required: false,
        },
        [HealthEntityType.reason]: {
            type: Number,
            required: false,
        },
    },
    { _id: false, versionKey: false },
);

const IntegrationInternalApi = new mongoose.Schema(
    {
        url: String,
        token: String,
        methods: {
            listAvailableExams: Boolean,
        },
    },
    { _id: false, versionKey: false },
);

const Routines = new mongoose.Schema(
    {
        cronSearchAvailableSchedules: {
            require: false,
            type: Boolean,
        },
    },
    { _id: false, versionKey: false },
);

export const HealthIntegrationSchema = new mongoose.Schema(
    {
        name: String,
        entitiesToSync: {
            type: [String],
            enum: [...Object.keys(HealthEntityType)],
        },
        entitiesFlow: {
            type: [String],
            enum: [...Object.keys(HealthEntityType)],
        },
        showExternalEntities: {
            type: [String],
            enum: [...Object.keys(HealthEntityType)],
            required: false,
        },
        type: String,
        workspaceId: {
            type: mongoose.Types.ObjectId,
            index: true,
        },
        syncStatus: {
            type: Number,
            enum: [...Object.values(HealthIntegrationSynchronizeStatus)],
        },
        lastSyncTimestamp: Number,
        lastSyncErrorTimestamp: Number,
        lastSyncEntities: Number,
        lastPublishFlowDraft: {
            type: Number,
            required: false,
        },
        lastPublishFlow: {
            type: Number,
            required: false,
        },
        lastSinglePublishEntities: {
            type: HealthIntegrationLastSinglePublishEntities,
            required: false,
        },
        enabled: Boolean,
        rules: {
            type: HealthIntegrationRules,
            required: false,
            default: {},
        },
        environment: {
            type: String,
            enum: [...Object.keys(IntegrationEnvironment)],
        },
        syncType: {
            type: String,
            enum: [...Object.values(IntegrationSyncType)],
        },
        debug: {
            type: Boolean,
            required: false,
        },
        auditRequests: {
            type: Boolean,
            required: false,
        },
        internalApi: {
            type: IntegrationInternalApi,
            required: false,
        },
        routines: {
            type: Routines,
            required: false,
        },
        scheduling: mongoose.Schema.Types.Mixed,
        messages: mongoose.Schema.Types.Mixed,
        deletedAt: Number,
    },
    { versionKey: false, collection: 'health_integration', autoIndex: true, strictQuery: true },
);

HealthIntegrationSchema.plugin(AfterFindSoftDeletePlugin);

export const HealthIntegrationModel: mongoose.Model<HealthIntegration> = mongoose.model<HealthIntegration>(
    'health-integration',
    HealthIntegrationSchema,
);
