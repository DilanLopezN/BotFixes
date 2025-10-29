import * as mongoose from 'mongoose';
import {
    HealthIntegration,
    IntegrationEnvironment,
    IntegrationSyncType,
} from '../../interfaces/health/health-integration.interface';
import { HealthEntityType, HealthIntegrationSynchronizeStatus } from 'kissbot-core';
import { AfterFindSoftDeletePlugin } from '../../../../common/mongoosePlugins/afterFindSoftDelete.plugin';

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
        [HealthEntityType.laterality]: {
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

const IntegrationDocuments = new mongoose.Schema(
    {
        enableDocumentsUpload: Boolean,
        documentsMaxSizeInMb: Number,
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
        rules: mongoose.Schema.Types.Mixed,
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
        documents: {
            type: IntegrationDocuments,
            required: false,
        },
    },
    { versionKey: false, collection: 'health_integration', autoIndex: true, strictQuery: true },
);

HealthIntegrationSchema.plugin(AfterFindSoftDeletePlugin);

export const HealthIntegrationModel: mongoose.Model<HealthIntegration> = mongoose.model<HealthIntegration>(
    'health-integration',
    HealthIntegrationSchema,
);
