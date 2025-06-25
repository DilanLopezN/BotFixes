import * as mongoose from 'mongoose';

export const UserFeatureFlagSchema = new mongoose.Schema(
    {
        enableConversationCategorization: Boolean,
        enableRemi: Boolean,
    },
    { versionKey: false, _id: false },
);
