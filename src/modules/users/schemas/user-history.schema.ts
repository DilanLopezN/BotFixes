import * as mongoose from 'mongoose';
import { UserSchema } from './user.schema';
import { UserHistory } from '../interfaces/user.history';
import { DatePlugin } from '../../../common/mongoosePlugins/date.plugin';

export const UserHistorySchema = new mongoose.Schema({}, {
    collection: 'users_history',
    versionKey: false,
    strictQuery: true,
});

UserHistorySchema.add(UserSchema.clone());
UserHistorySchema.add({
    userId: mongoose.Types.ObjectId,
    updatedByUserId: mongoose.Types.ObjectId,
});

UserHistorySchema.remove(['deletedAt', 'createdAt', 'updatedAt']);
UserHistorySchema.plugin(DatePlugin);

export const UserHistoryModel: mongoose.Model<UserHistory> = mongoose.model<UserHistory>(
    'UserHistory',
    UserHistorySchema,
);
