import * as mongoose from 'mongoose';
import { ConditionType, ConditionMethodType, ResponseType } from 'kissbot-core';
import { Interaction } from '../interfaces/interaction.interface';
import { InteractionType, ResponseButtonType } from '../interfaces/response.interface';
import { SetAttributeAction } from '../interfaces/responseType.interface';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { RecognizerType } from '../interfaces/userSay.interface';
import { FilterOperator } from '../interfaces/filter.interface';

const ParameterSchema = new mongoose.Schema(
    {
        name: {
            required: true,
            type: String,
        },
        type: String,
        typeId: String,
        mandatory: Boolean,
        defaultValue: mongoose.Schema.Types.Mixed,
        value: mongoose.Schema.Types.Mixed,
    },
    { versionKey: false },
);

const CommentSchema = new mongoose.Schema(
    {
        comment: String,
        userId: mongoose.Schema.Types.ObjectId,
    },
    { versionKey: false },
);

CommentSchema.plugin(TimesmapPlugin);

const ConditionSchema = new mongoose.Schema(
    {
        name: String,
        operator: {
            type: String,
            enum: [...Object.values(ConditionMethodType)],
        },
        value: String,
        type: {
            type: String,
            enum: [ConditionType.attribute, ConditionType.lifespan, ConditionType.recognizerScore],
        },
    },
    { versionKey: false },
);

const FilterSchema = new mongoose.Schema(
    {
        operator: {
            type: String,
            enum: [FilterOperator.and, FilterOperator.or],
        },
        conditions: [ConditionSchema],
    },
    { versionKey: false, _id: false },
);

const ResponseButton = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [ResponseButtonType.goto, ResponseButtonType.phone, ResponseButtonType.url],
        },
        title: String,
        value: String,
    },
    { versionKey: false, _id: false },
);

const ElementSchema = new mongoose.Schema({}, { versionKey: false, discriminatorKey: 'element' });

const ElementModel = mongoose.model('elements', ElementSchema);

ElementModel.discriminator('IResponseElementMessage', new mongoose.Schema({ text: String }, { versionKey: false }));

ElementModel.discriminator(
    'IResponseElementWebhook',
    new mongoose.Schema({ webhookId: String }, { versionKey: false }),
);

ElementModel.discriminator(
    'IResponseElementButtons',
    new mongoose.Schema(
        {
            title: String,
            buttons: ResponseButton,
        },
        { versionKey: false },
    ),
);

ElementModel.discriminator(
    'IResponseElementCard',
    new mongoose.Schema(
        {
            title: String,
            subtitle: String,
            imageUrl: String,
        },
        { versionKey: false },
    ),
);

ElementModel.discriminator(
    'IResponseElementSetAttribute',
    new mongoose.Schema(
        {
            name: String,
            action: {
                type: String,
                enum: [SetAttributeAction.remove, SetAttributeAction.set],
            },
            value: String,
        },
        { versionKey: false },
    ),
);

const ResponseSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [...Object.values(ResponseType)],
            default: ResponseType.TEXT,
        },
        delay: Number,
        sendTypping: Boolean,
        filter: FilterSchema,
        elements: [mongoose.Schema.Types.Mixed],
    },
    { versionKey: false },
);

const PartSchema = new mongoose.Schema(
    {
        value: String,
        type: String,
        name: String,
        mandatory: Boolean,
    },
    { versionKey: false, _id: false },
);

const UserSaySchema = new mongoose.Schema(
    {
        recognizer: {
            type: String,
            enum: [RecognizerType.ai, RecognizerType.keyword],
        },
        parts: [PartSchema],
    },
    { versionKey: false },
);

const LanguageSchema = new mongoose.Schema(
    {
        language: String,
        responses: [ResponseSchema],
        userSays: [UserSaySchema],
        intents: [String],
    },
    { versionKey: false, _id: false },
);

const interactionSchemaConfig = {
    name: { type: String },
    action: { type: String },
    description: { type: String },
    type: {
        type: String,
        enum: [
            InteractionType.welcome,
            InteractionType.fallback,
            InteractionType.contextFallback,
            InteractionType.interaction,
            InteractionType.container,
        ],
        default: InteractionType.interaction,
    },
    parameters: [ParameterSchema],
    comments: [CommentSchema],
    languages: [LanguageSchema],
    isCollapsed: mongoose.Schema.Types.Boolean,
    triggers: [{ type: String }],
    children: [{ type: String }],
    path: [{ type: String }],
    completePath: [{ type: String }],
    labels: [String],
    position: { type: Number },
    workspaceId: mongoose.Schema.Types.ObjectId,
    botId: mongoose.Schema.Types.ObjectId,
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        index: true,
    },
    params: { type: mongoose.Schema.Types.Mixed },
    lastUpdateBy: {
        userId: String,
        updatedAt: Number,
    },
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        index: true,
    },
    publishedAt: { type: String },
};

const InteractionSchema = new mongoose.Schema(interactionSchemaConfig, { versionKey: false, strictQuery: true });

InteractionSchema.plugin(AfterFindSoftDeletePlugin);
InteractionSchema.plugin(TimesmapPlugin);

const InteractionModel: mongoose.Model<Interaction> = mongoose.model<Interaction>('Interaction', InteractionSchema);

export {
    ParameterSchema,
    CommentSchema,
    ConditionSchema,
    FilterSchema,
    ResponseButton,
    ElementSchema,
    ElementModel,
    ResponseSchema,
    PartSchema,
    UserSaySchema,
    LanguageSchema,
    InteractionSchema,
    InteractionModel,
    interactionSchemaConfig,
};
