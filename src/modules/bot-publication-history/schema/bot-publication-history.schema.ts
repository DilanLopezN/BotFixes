import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { BotsPublicationsHistoryDto } from '../dto/bot-publication-history.dto';

export const BotsPublicationsHistorySchema = new mongoose.Schema(
    {
        workspaceId: Schema.Types.ObjectId,
        botId: Schema.Types.ObjectId,
        userId: Schema.Types.ObjectId,
        publishedAt: Number,
        comment: {
            required: false,
            type: String,
        },
    },
    { versionKey: false, collection: 'bots_publications_history', strictQuery: true },
);

BotsPublicationsHistorySchema.plugin(AfterFindSoftDeletePlugin);
export const BotsPublicationsHistoryModel: mongoose.Model<BotsPublicationsHistoryDto> =
    mongoose.model<BotsPublicationsHistoryDto>('BotsPublicationsHistory', BotsPublicationsHistorySchema);
