import * as mongoose from 'mongoose';
import { FlowHistory } from '../../interfaces/health/health-flow-history.interface';
import { HealthFlowSchema } from './health-flow.schema';

export const FlowHistorySchema = new mongoose.Schema(
    {
        integrationId: mongoose.Types.ObjectId,
        flowId: mongoose.Types.ObjectId,
        updatedByUserId: mongoose.Types.ObjectId,
        flow: HealthFlowSchema,
        workspaceId: mongoose.Types.ObjectId,
        createdAt: Number,
    },
    {
        collection: 'flow_history',
        versionKey: false,
        strictQuery: true,
    },
);

export const FlowHistoryModel: mongoose.Model<FlowHistory> = mongoose.model<FlowHistory>(
    'FlowHistory',
    FlowHistorySchema,
);
