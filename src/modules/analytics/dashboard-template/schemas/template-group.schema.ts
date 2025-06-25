import * as mongoose from 'mongoose';

export const TemplateGroupSchema = new mongoose.Schema(
    {
        workspaceId: String,
        name: String,
        ownerId: String,
        shared: Boolean,
        globalEditable: Boolean,
    },
    { versionKey: false, collection: 'conversation_template_group', strictQuery: true },
);
