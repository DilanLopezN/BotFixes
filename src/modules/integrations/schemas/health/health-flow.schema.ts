import * as mongoose from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { FlowActionType, FlowTriggerType, FlowType, HealthFlow, HealthFlowSteps } from 'kissbot-core';

export const HealthFlowActionsSchema = new mongoose.Schema(
    {
        type: {
            enum: [...Object.values(FlowActionType)],
            type: String,
            required: true,
        },
        element: {
            required: true,
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { versionKey: false, _id: false },
);

const { ObjectId } = mongoose.Types;

export const HealthFlowSchema = new mongoose.Schema(
    {
        organizationUnitId: [ObjectId],
        insuranceId: [ObjectId],
        typeOfServiceId: [ObjectId],
        insurancePlanId: [ObjectId],
        specialityId: [ObjectId],
        procedureId: [ObjectId],
        planCategoryId: [ObjectId],
        insuranceSubPlanId: [ObjectId],
        doctorId: [ObjectId],
        groupId: [ObjectId],
        appointmentTypeId: [ObjectId],
        occupationAreaId: [ObjectId],
        organizationUnitLocationId: [ObjectId],
        lateralityId: [ObjectId],
        reasonId: [ObjectId],
        integrationId: {
            type: ObjectId,
            required: true,
        },
        workspaceId: {
            type: ObjectId,
            required: true,
        },
        actions: {
            type: [HealthFlowActionsSchema],
            required: false,
        },
        step: {
            type: [String],
            enum: [...Object.values(HealthFlowSteps)],
        },
        opposeStep: {
            type: [String],
            enum: [...Object.values(HealthFlowSteps)],
        },
        type: {
            enum: [...Object.values(FlowType)],
            type: String,
        },
        inactive: {
            default: false,
            required: false,
            type: Boolean,
        },
        createdAt: Number,
        updatedAt: Number,
        updatedByUserId: {
            required: false,
            type: String,
        },
        periodOfDay: Number,
        maximumAge: Number,
        minimumAge: Number,
        sex: {
            required: false,
            type: String,
        },
        description: {
            required: false,
            type: String,
        },
        cpfs: {
            required: false,
            type: [String],
        },
        executeFrom: {
            required: false,
            type: Number,
        },
        executeUntil: {
            required: false,
            type: Number,
        },
        runBetweenStart: {
            required: false,
            type: Number,
        },
        runBetweenEnd: {
            required: false,
            type: Number,
        },
        trigger: {
            type: [String],
            required: false,
            enum: [...Object.values(FlowTriggerType)],
        },
    },
    { versionKey: false, collection: 'health_flow', autoIndex: true, strictQuery: true },
);

HealthFlowSchema.index({
    workspaceId: 1,
    integrationId: 1,
    type: 1,
    step: 1,
});

HealthFlowSchema.plugin(AfterFindSoftDeletePlugin);

export const TagsModel: mongoose.Model<HealthFlow & mongoose.Document> = mongoose.model<HealthFlow & mongoose.Document>(
    'health_flow',
    HealthFlowSchema,
);
