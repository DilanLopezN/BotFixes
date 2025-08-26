import { TimesmapPlugin } from './../../../common/mongoosePlugins/timestamp.plugin';
import * as mongoose from 'mongoose';
import { TemplateMessage } from '../interface/template-message.interface';
import { AfterFindSoftDeletePlugin } from './../../../common/mongoosePlugins/afterFindSoftDelete.plugin';

export enum TemplateType {
    message = 'message',
    file = 'file',
}

export enum TemplateCategory {
    MARKETING = 'MARKETING',
    UTILITY = 'UTILITY',
    AUTHENTICATION = 'AUTHENTICATION',
}

export enum TemplateLanguage {
    pt_BR = 'pt_BR',
    pt_PT = 'pt_PT',
    en = 'en',
    en_US = 'en_US',
    en_GB = 'en_GB',
    es = 'es',
    es_AR = 'es_AR',
    es_ES = 'es_ES',
    es_MX = 'es_MX',
}

export enum TemplateRejectionReason {
    ABUSIVE_CONTENT = 'abusive_content',
    INVALID_FORMAT = 'invalid_format',
    NONE = 'none',
    PROMOTIONAL = 'promotional',
    TAG_CONTENT_MISMATCH = 'tag_content_mismatch',
    SCAM = 'scam',
}

// The status of the message template can be: APPROVED, IN_APPEAL, PENDING, REJECTED, PENDING_DELETION, DELETED, DISABLED, PAUSED, LIMIT_EXCEEDED.
export enum TemplateStatus {
    APPROVED = 'approved',
    IN_APPEAL = 'in_appeal',
    PENDING = 'pending',
    REJECTED = 'rejected',
    PENDING_DELETION = 'pending_deletion',
    DELETED = 'deleted',
    DISABLED = 'disabled',
    PAUSED = 'paused',
    LIMIT_EXCEEDED = 'limit_exceeded',
    AWAITING_APPROVAL = 'awaiting_approval',
    ERROR_ONSUBMIT = 'error_onsubmit',
}

export enum TemplateButtonType {
    QUICK_REPLY = 'QUICK_REPLY',
    URL = 'URL',
    COPY_CODE = 'COPY_CODE',
    FLOW = 'FLOW',
}

const VariableSchema = new mongoose.Schema(
    {
        value: {
            type: String,
            required: false,
        },
        label: {
            type: String,
            required: false,
        },
        type: {
            type: String,
            required: false,
        },
        required: {
            type: Boolean,
            required: false,
        },
        sampleValue: {
            type: String,
            required: false,
        },
    },
    { _id: true },
);

const TemplateButtonSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [...Object.keys(TemplateButtonType)],
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: false,
        },
        example: {
            type: [String],
            default: null,
            required: false,
        },

        flowDataId: {
            type: Number,
            required: false,
        },
        flow_id: {
            type: String,
            required: false,
        },
        flow_action: {
            type: String,
            required: false,
        },
    },
    { _id: false },
);

export const TemplateMessageSchema = new mongoose.Schema(
    {
        message: String,
        name: String,
        footerMessage: {
            type: String,
            required: false,
        },
        userId: {
            type: mongoose.Types.ObjectId,
            required: false,
        },
        workspaceId: {
            type: mongoose.Types.ObjectId,
            required: false,
        },
        tags: [String],
        isHsm: Boolean,
        active: {
            type: Boolean,
            required: false,
        },
        canEdit: Boolean,
        teams: {
            type: [mongoose.Types.ObjectId],
            required: false,
        },
        channels: {
            type: [mongoose.Types.ObjectId],
            required: false,
        },
        channelsBackup: {
            type: [mongoose.Types.ObjectId],
            required: false,
        },
        variables: {
            type: [VariableSchema],
            required: false,
        },
        type: {
            type: String,
            enum: [...Object.keys(TemplateType)],
            required: false,
        },
        wabaResult: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        buttons: {
            type: [TemplateButtonSchema],
            required: false,
        },
        status: {
            type: String,
            enum: [...Object.values(TemplateStatus)],
            required: false,
        },
        rejectedReason: {
            type: String,
            required: false,
        },
        whatsappTemplateId: {
            type: String,
            required: false,
        },
        languageCode: {
            type: String,
            enum: [...Object.values(TemplateLanguage)],
            required: false,
            default: TemplateLanguage.pt_BR,
        },
        fileUrl: {
            type: String,
            required: false,
        },
        fileContentType: {
            type: String,
            required: false,
        },
        fileOriginalName: {
            type: String,
            required: false,
        },
        fileKey: {
            type: String,
            required: false,
        },
        fileSize: {
            type: Number,
            required: false,
        },
        action: {
            type: String,
            required: false,
        },
    },
    { versionKey: false, collection: 'template_messages', strictQuery: true },
);

TemplateMessageSchema.plugin(AfterFindSoftDeletePlugin);
TemplateMessageSchema.plugin(TimesmapPlugin);

export const TemplateMessageModel: mongoose.Model<TemplateMessage> = mongoose.model<TemplateMessage>(
    'TemplateMessage',
    TemplateMessageSchema,
    'template_messages',
);
