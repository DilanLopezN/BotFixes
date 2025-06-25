import * as mongoose from 'mongoose';
import { DatePlugin } from '../../../common/mongoosePlugins/date.plugin';
import { InteractionHistory } from '../interfaces/interaction.history';
import { InteractionSchema } from './interaction.schema';

export const InteractionHistorySchema = new mongoose.Schema(
    {
        interactionId: mongoose.Types.ObjectId,
        updatedByUserId: mongoose.Types.ObjectId,
        interaction: InteractionSchema,
        botId: mongoose.Types.ObjectId,
        workspaceId: mongoose.Types.ObjectId,
        createdAt: Number,
    },
    {
        collection: 'interactions_history',
        versionKey: false,
        strictQuery: true,
    },
);

export const TeamHistoryModel: mongoose.Model<InteractionHistory> = mongoose.model<InteractionHistory>(
    'InteractionHistory',
    InteractionHistorySchema,
);
