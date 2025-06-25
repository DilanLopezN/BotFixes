import * as mongoose from "mongoose";

export class PrivateConversationData extends mongoose.Document{
    conversationId: mongoose.Types.ObjectId;
    privateData?: any;
    endMessage?: string;
}
