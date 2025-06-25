import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { FlowPublicationHistory } from '../interface/health-publication-flow-history.interface';

export const FlowPublicationHistorySchema = new mongoose.Schema(
    {
        workspaceId: Schema.Types.ObjectId,
        integrationId: Schema.Types.ObjectId,
        userId: Schema.Types.ObjectId,
        publishedAt: Number,
    },
    { versionKey: false, collection: 'flow_publication_history', strictQuery: true },
);

FlowPublicationHistorySchema.plugin(AfterFindSoftDeletePlugin);
export const FlowPublicationHistoryModel: mongoose.Model<FlowPublicationHistory> =
    mongoose.model<FlowPublicationHistory>('FlowPublicationHistory', FlowPublicationHistorySchema);
