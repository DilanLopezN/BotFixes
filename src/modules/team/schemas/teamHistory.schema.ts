import * as mongoose from 'mongoose';
import { TeamSchema } from './team.schema';
import { TeamHistory } from '../interfaces/team.history';
import { DatePlugin } from '../../../common/mongoosePlugins/date.plugin';

export const TeamHistorySchema = new mongoose.Schema(
    {},
    {
        collection: 'teams_history',
        versionKey: false,
        strictQuery: true,
    },
);

TeamHistorySchema.add(TeamSchema.clone());
TeamHistorySchema.add({
    teamId: mongoose.Types.ObjectId,
    updatedByUserId: mongoose.Types.ObjectId,
});

TeamHistorySchema.remove(['createdAt', 'updatedAt']);
TeamHistorySchema.plugin(DatePlugin);

export const TeamHistoryModel: mongoose.Model<TeamHistory> = mongoose.model<TeamHistory>(
    'TeamHistory',
    TeamHistorySchema,
);
