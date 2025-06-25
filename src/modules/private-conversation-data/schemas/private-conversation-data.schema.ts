import * as mongoose from 'mongoose';
import { PrivateConversationData } from '../interfaces/private-conversation-data.interface';

export const PrivateConversationDataSchema = new mongoose.Schema({
    conversationId: mongoose.Types.ObjectId,

    privateData: mongoose.Schema.Types.Mixed,

    endMessage: String,
},
    { versionKey: false, collection: 'privateconversationdatas', strictQuery: true },
);

export const PrivateConversationDataModel: mongoose.Model<PrivateConversationData> = mongoose.model<PrivateConversationData>(
    'PrivateConversationData',
    PrivateConversationDataSchema,
    'privateconversationdatas',
);