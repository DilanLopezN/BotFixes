import { Contact } from './../interface/contact.interface';
import * as mongoose from 'mongoose';

export const ContactSchema = new mongoose.Schema(
    {
        phone: {
            required: false,
            type: String,
        },
        telegram: {
            required: false,
            type: String,
        },
        email: {
            required: false,
            type: String,
        },
        name: {
            required: false,
            type: String,
        },
        conversations: {
            required: false,
            type: [String],
            default: [],
        },
        createdByChannel: {
            required: true,
            type: String,
        },
        workspaceId: {
            required: true,
            type: String,
        },
        whatsapp: {
            required: false,
            type: String,
        },
        blockedAt: {
            type: Number,
            required: false,
        },
        blockedBy: {
            type: String,
            required: false,
        },
        ddi: {
            required: false,
            type: String,
        },
    },
    { versionKey: false, collection: 'contact', strictQuery: true },
);

ContactSchema.index({ workspaceId: 1, telegram: 1 });
ContactSchema.index({ workspaceId: 1, whatsapp: 1 }, { unique: true });

export const ContactModel: mongoose.Model<Contact> = mongoose.model<Contact>('Contact', ContactSchema);
