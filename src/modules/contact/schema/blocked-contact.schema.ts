import { BlockedContact } from '../interface/blocked-contact.interface';
import * as mongoose from 'mongoose';

export const BlockedContactSchema = new mongoose.Schema(
    {
        phone: {
            required: true,
            type: String,
        },
        workspaceId: {
            required: true,
            type: String,
        },
        whatsapp: {
            required: true,
            type: String,
        },
        blockedAt: {
            type: Number,
            required: true,
        },
        blockedBy: {
            type: String,
            required: true,
        },
        contactId: {
            required: true,
            type: String,
        },
    },
    { versionKey: false, collection: 'blocked_contact', strictQuery: true },
);

BlockedContactSchema.index({ workspaceId: 1 });

export const BlockedContactModel: mongoose.Model<BlockedContact> = mongoose.model<BlockedContact>(
    'BlockedContact',
    BlockedContactSchema,
);
