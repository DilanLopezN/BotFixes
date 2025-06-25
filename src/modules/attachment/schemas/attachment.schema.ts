import * as mongoose from 'mongoose';
import { Attachment } from './../interfaces/attchment.interface';
export const AttachmentSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Types.ObjectId,
            index: true,
        },
        memberId: String,
        attachmentLocation: String,
        name: String,
        mimeType: String,
        timestamp: Number,
        key: String,
        size: Number,
    },
    { versionKey: false, collection: 'attachments', strictQuery: true },
);


export const AttachmentModel: mongoose.Model<Attachment> = mongoose.model<Attachment>(
    'Attachment',
    AttachmentSchema,
    'attachments',
);
