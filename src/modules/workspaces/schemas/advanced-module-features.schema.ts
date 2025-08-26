import * as mongoose from 'mongoose';

export const AdvancedModuleFeaturesSchema = new mongoose.Schema(
    {
        agentStatus: Boolean,
    },
    { versionKey: false, _id: false },
);
