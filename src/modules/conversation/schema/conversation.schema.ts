import {
    Conversation,
    ConversationMetrics,
    ConversationStatus,
    ConversationTag,
} from './../interfaces/conversation.interface';
import * as mongoose from 'mongoose';
import { IdentitySchema } from './identity.schema';

export const RedirectConversationSchema = new mongoose.Schema(
    {
        _id: String,
        to: String,
        data: mongoose.Schema.Types.Mixed,
    },
    { versionKey: false, _id: false },
);

export const ConversationTagSchema = new mongoose.Schema(
    {
        _id: String,
        name: String,
        color: String,
    },
    { versionKey: false },
);

const AttributesSchema = new mongoose.Schema(
    {
        value: mongoose.Schema.Types.Mixed,
        type: String,
        label: {
            type: String,
            required: false,
        },
        name: String,
    },
    { versionKey: false, _id: false },
);

export const FileAttachmentSchema = new mongoose.Schema(
    {
        contentUrl: String,
        name: String,
        mimeType: String,
        memberId: String,
        timestamp: Number,
    },
    { versionKey: false, _id: true },
);

export const ConversationMetricsSchema = new mongoose.Schema(
    {
        assignmentAt: Number,
        automaticDurationAttendance: Number,
        closeAt: Number,
        timeToAssignment: Number,
        timeToAgentReply: Number,
        timeToUserReply: Number,
        timeToClose: Number,
        lastUserReplyAt: Number,
        lastAgentReplyAt: Number,
        firstAgentReplyAt: Number,
        medianTimeToUserReply: Number,
        medianTimeToAgentReply: Number,
        awaitingWorkingTime: Number,
    },
    { versionKey: false, _id: false },
);

export const ConversationMetricsModel: mongoose.Model<ConversationMetrics> = mongoose.model<ConversationMetrics>(
    'ConversationMetrics',
    ConversationMetricsSchema,
);

export const ConversationSchema = new mongoose.Schema(
    {
        expiresAt: Number,

        beforeExpirationTime: {
            required: false,
            type: Number,
        },
        beforeExpiresAt: {
            required: false,
            type: Number,
        },

        expirationTime: Number,

        token: String,
        createdAt: String,
        updatedAt: String,
        organizationId: mongoose.Types.ObjectId,
        hash: String,
        iid: Number,
        members: [IdentitySchema],
        redirect: {
            type: RedirectConversationSchema,
            required: false,
        },
        tags: {
            type: [ConversationTagSchema],
            required: false,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        state: {
            type: String,
            enum: [...Object.keys(ConversationStatus)],
        },
        requestIp: {
            type: String,
        },
        refererUrl: {
            type: String,
            required: false,
        },
        fileAttachments: {
            type: [FileAttachmentSchema],
            required: false,
        },
        lastNotification: String,
        workspace: {
            _id: {
                required: false,
                type: String,
            },
            name: {
                required: false,
                type: String,
            },
        },
        bot: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        seenBy: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            default: {},
        },
        shouldRequestRating: {
            required: false,
            type: Boolean,
        },
        whatsappExpiration: {
            required: false,
            type: Number,
        },
        createdByChannel: {
            required: false,
            type: String,
        },
        pinnedBy: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            default: {},
        },
        attributes: {
            type: [AttributesSchema],
            required: false,
        },
        waitingSince: {
            required: false,
            type: Number,
        },
        priority: {
            required: false,
            type: Number,
        },
        order: {
            required: false,
            type: Number,
        },
        whatsappSessionCount: {
            required: false,
            type: Number,
        },
        assignedToUserId: String,
        assignedToTeamId: String,
        closedBy: String,
        invalidNumber: {
            required: false,
            type: Boolean,
        },
        suspendedUntil: {
            type: Number,
            required: false,
        },
        metrics: {
            type: ConversationMetricsSchema,
            required: false,
        },
        timezone: {
            type: String,
            required: false,
        },
        referralSourceId: {
            type: String,
            required: false,
        },
        deliveredMessage: {
            type: Boolean,
            required: false,
            default: false,
        },
        isWithSmtRe: {
            type: Boolean,
            required: false,
        },
        smtReId: {
            type: String,
            required: false,
        },
        stoppedSmtReId: {
            type: String,
            required: false,
        },
    },
    { versionKey: false, collection: 'conversations_api', strictQuery: true },
);

export const ConversationModel: mongoose.Model<Conversation> = mongoose.model<Conversation>(
    'Conversation',
    ConversationSchema,
);

export const ConversationTagModel: mongoose.Model<ConversationTag> = mongoose.model<ConversationTag>(
    'ConversationTag',
    ConversationTagSchema,
);
