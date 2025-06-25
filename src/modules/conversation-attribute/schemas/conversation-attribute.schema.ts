import * as mongoose from 'mongoose';
import { ConversationAttribute } from './../interfaces/conversation-attribute.interface';
export const AttributeSchema = new mongoose.Schema(
    {
        name: String,
        value: mongoose.SchemaTypes.Mixed,
        label: String,
        type: String,
    },
    { versionKey: false },
);

export const ConversationAttributeSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Types.ObjectId,
            index: true,
        },
        data: [AttributeSchema],
    },
    { versionKey: false, collection: 'conversationattributes', strictQuery: true },
);

export const ConversationAttributeModel: mongoose.Model<ConversationAttribute> = mongoose.model<ConversationAttribute>(
    'ConversationAttribute',
    ConversationAttributeSchema,
    'conversationattributes',
);
