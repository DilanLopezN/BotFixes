import * as mongoose from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { Activity } from '../interfaces/activity';
import { ActivityType, AckType } from 'kissbot-core';
import { IdentitySchema } from './../../../modules/conversation/schema/identity.schema';

const AttachmentSchema = new mongoose.Schema(
    {
        contentType: {
            type: String,
            required: false,
        },
        contentUrl: {
            type: String,
            required: false,
        },
        content: {
            required: false,
            type: mongoose.Schema.Types.Mixed,
        },
        name: {
            type: String,
            required: false,
        },
        thumbnailUrl: {
            type: String,
            required: false,
        },
    },
    { versionKey: false, _id: false },
);

const AttachmentFileSchema = new mongoose.Schema(
    {
        contentType: {
            type: String,
            required: false,
        },
        contentUrl: {
            type: String,
            required: false,
        },
        name: {
            type: String,
            required: false,
        },
        key: {
            type: String,
            required: false,
        },
        id: {
            type: String,
            required: false,
        },
    },
    { versionKey: false, _id: false },
);

const RecognizerResultSchema = new mongoose.Schema(
    {
        interactionId: {
            type: String,
        },
        recognizer: {
            type: String,
        },
        score: {
            type: String,
        },
        entities: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { versionKey: false, _id: false },
);

export const ActivitySchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [...Object.keys(ActivityType)],
        },
        ack: {
            type: Number,
            enum: [...Object.keys(AckType)],
            default: AckType.Pending,
        },
        isHsm: Boolean,
        text: {
            required: false,
            type: String,
        },
        attachments: {
            type: [AttachmentSchema],
            required: false,
            default: undefined,
        },
        attachmentFile: {
            type: AttachmentFileSchema,
            required: false,
        },
        name: {
            type: String,
            required: false,
        },
        conversationId: {
            type: String,
            index: true,
        },
        workspaceId: {
            type: String,
            index: true,
        },
        botId: {
            type: String,
        },
        timestamp: {
            type: Number,
            required: false,
        },
        channelId: {
            required: false,
            type: String,
        },
        hash: {
            required: true,
            type: String,
            index: true,
            unique: true,
        },
        quoted: {
            required: false,
            type: String,
        },
        from: {
            type: IdentitySchema,
            required: false,
        },
        isTest: {
            type: Boolean,
            required: false,
        },
        language: {
            type: String,
            required: false,
        },
        id: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        requestIp: {
            type: String,
            required: false,
        },
        refererUrl: {
            type: String,
            required: false,
        },
        createdAt: {
            type: Date,
            required: false,
        },
        recognizerResult: {
            type: RecognizerResultSchema,
            required: false,
        },
        referralSourceId: {
            required: false,
            type: String,
        },
    },
    { versionKey: false, collection: 'activity_api', strictQuery: true },
);

ActivitySchema.plugin(AfterFindSoftDeletePlugin);

export default ActivitySchema;
export const ActivityModel: mongoose.Model<Activity> = mongoose.model<Activity>('activity', ActivitySchema);
