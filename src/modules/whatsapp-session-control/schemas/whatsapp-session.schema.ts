import * as mongoose from 'mongoose';

export const WhatsappSessionSchema = new mongoose.Schema(
    {
        whatsappExpiration: Number,
        channelConfigId: String,
        workspaceId: String,
        originNumber: String,
        integrationToken: String,
    },
    { versionKey: false, collection: 'whatsapp_session', strictQuery: true },
);

export const WhatsappSessionModel = mongoose.model(
    'WhatsappSession',
    WhatsappSessionSchema,
);