import * as mongoose from 'mongoose';
import { HealthEntity } from '../../interfaces/health/health-entity.interface';
import { HealthEntityType, HealthEntitySource } from 'kissbot-core';
export { HealthEntityType };

export const HealthEntityReferenceSchema = new mongoose.Schema(
    {
        type: {
            enum: HealthEntityType,
            type: String,
            required: true,
        },
        refId: {
            required: true,
            type: mongoose.Types.ObjectId,
        },
    },
    { versionKey: false, _id: false },
);

const HealthEntityParentSchema = new mongoose.Schema({});
const HealthEntityDraftSchema = new mongoose.Schema({});

export const HealthEntitySchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
        },
        name: String,
        friendlyName: String,
        synonyms: [String],
        internalSynonyms: [String],
        version: String,
        workspaceId: {
            type: mongoose.Types.ObjectId,
        },
        integrationId: {
            type: mongoose.Types.ObjectId,
        },
        entityType: {
            type: String,
            enum: HealthEntityType,
        },
        source: {
            type: Number,
            enum: HealthEntitySource,
            default: HealthEntitySource.erp,
        },
        order: {
            type: Number,
            default: -1,
        },
        specialityType: String,
        specialityCode: String,
        insuranceCode: String,
        insurancePlanCode: String,
        parent: HealthEntityParentSchema,
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        params: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            default: {},
        },
        activeErp: Boolean,
        createdAt: Number,
        deletedAt: Number,
        updatedAt: Number,
        updatedBy: String,
        createdBy: String,
        draft: {
            type: HealthEntityDraftSchema,
            required: false,
        },
        references: [HealthEntityReferenceSchema],
        guidance: String,
        canSchedule: { type: Boolean, required: false, default: true },
        canReschedule: { type: Boolean, required: false, default: true },
        canCancel: { type: Boolean, required: false, default: true },
        canConfirmActive: { type: Boolean, required: false, default: true },
        canConfirmPassive: { type: Boolean, required: false, default: true },
        canView: { type: Boolean, required: false, default: true },
    },
    { versionKey: false, collection: 'health_entity', autoIndex: true, strictQuery: true },
);

HealthEntityParentSchema.add(HealthEntitySchema.clone());
HealthEntityParentSchema.add({
    workspaceId: {
        type: mongoose.Types.ObjectId,
    },
    integrationId: {
        type: mongoose.Types.ObjectId,
    },
});

HealthEntityDraftSchema.add(HealthEntitySchema.clone());
HealthEntityDraftSchema.remove('draft');

HealthEntitySchema.index({
    workspaceId: 1,
    integrationId: 1,
    entityType: 1,
    code: 1,
    source: 1,
});

HealthEntitySchema.index({
    workspaceId: 1,
    integrationId: 1,
    entityType: 1,
    'parent._id': 1,
});

export const HealthEntityModel: mongoose.Model<HealthEntity> = mongoose.model<HealthEntity>(
    'health-entity',
    HealthEntitySchema,
);
