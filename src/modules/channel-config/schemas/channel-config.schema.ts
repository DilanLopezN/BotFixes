import * as mongoose from 'mongoose';
import { ChannelIdConfig, ChannelConfig } from '../interfaces/channel-config.interface';
import { AfterFindSoftDeletePlugin } from './../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from './../../../common/mongoosePlugins/timestamp.plugin';

export const AttendancePeriod = new mongoose.Schema(
    {
        start: Number,
        end: Number,
    },
    { versionKey: false, _id: false },
);

export const AttendancePeriods = new mongoose.Schema(
    {
        mon: [AttendancePeriod],
        tue: [AttendancePeriod],
        wed: [AttendancePeriod],
        thu: [AttendancePeriod],
        fri: [AttendancePeriod],
        sat: [AttendancePeriod],
        sun: [AttendancePeriod],
    },
    { versionKey: false, _id: false },
);

export enum ExpirationTimeType {
    minute = 'minute',
    hour = 'hour',
}

export enum ChannelConfigWhatsappProvider {
    gupshupv3 = 'gupshupv3',
    d360 = 'd360',
}

export const ChannelConfigSchema = new mongoose.Schema(
    {
        name: String,
        token: String,
        whatsappProvider: {
            type: String,
            required: false,
        },
        botId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        expirationTime: {
            type: {
                time: Number,
                timeType: {
                    type: String,
                    enum: [...Object.values(ExpirationTimeType)],
                },
            },
            required: false,
            default: {},
        },
        endMessage: {
            required: false,
            type: String,
        },
        keepLive: Boolean,
        enable: Boolean,
        configData: mongoose.Schema.Types.Mixed,
        attendancePeriods: AttendancePeriods,
        channelId: {
            type: String,
            enum: [...Object.values(ChannelIdConfig)],
            required: true,
        },
        canStartConversation: {
            required: false,
            default: true,
            type: Boolean,
        },
        canValidateNumber: {
            required: false,
            default: false,
            type: Boolean,
        },
        blockInboundAttendance: {
            required: false,
            default: false,
            type: Boolean,
        },
    },
    { versionKey: false, strictQuery: true },
);

ChannelConfigSchema.plugin(AfterFindSoftDeletePlugin);
ChannelConfigSchema.plugin(TimesmapPlugin);

export const ChannelConfigModel: mongoose.Model<ChannelConfig> = mongoose.model<ChannelConfig>(
    'ChannelConfig',
    ChannelConfigSchema,
);