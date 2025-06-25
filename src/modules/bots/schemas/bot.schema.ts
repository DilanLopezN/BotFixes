import * as mongoose from 'mongoose';
import { Bot } from '../interfaces/bot.interface';
import { Schema } from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';

export const LanguageSchema = new mongoose.Schema(
    {
        lang: String,
        flag: String,
    },
    { versionKey: false, _id: false },
);

export const BotLabelColorSchema = new mongoose.Schema(
    {
        name: String,
        hexColor: String,
    },
    { versionKey: false, _id: false },
);

export const BotLabelSchema = new mongoose.Schema(
    {
        _id: String,
        name: String,
        color: BotLabelColorSchema,
    },
    { versionKey: false, _id: false },
);

export const PublishDisabledSchema = new mongoose.Schema(
    {
        disabled: Boolean,
        disabledAt: Number,
        user: {
            id: String,
            name: String,
        },
    },
    { versionKey: false, _id: false },
);

export const BotSchema = new mongoose.Schema(
    {
        name: String,
        workspaceId: Schema.Types.ObjectId,
        organizationId: Schema.Types.ObjectId,
        params: Schema.Types.Mixed,
        languages: [LanguageSchema],
        labels: [BotLabelSchema],
        publishedAt: {
            required: false,
            type: Date,
            default: '2023-08-14T14:02:05.707Z',
        },
        updatedAt: {
            required: false,
            type: Date,
        },
        publishDisabled: {
            type: PublishDisabledSchema,
            required: false,
        },
        cloning: {
            type: Boolean,
            required: false,
        },
        cloningStartedAt: {
            required: false,
            type: Date,
        },
    },
    { versionKey: false, collection: 'bots', strictQuery: true },
);

BotSchema.plugin(AfterFindSoftDeletePlugin);
BotSchema.plugin(TimesmapPlugin);

export const BotModel: mongoose.Model<Bot> = mongoose.model<Bot>('Bot', BotSchema);
