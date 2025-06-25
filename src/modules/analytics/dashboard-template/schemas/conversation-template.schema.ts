import * as mongoose from 'mongoose';
import { AnalyticsInterval } from '../../conversation-analytics/interfaces/analytics.interface';
import { ChartType, ConversationTemplate, Operator, TemplateGroupField, TemplateMetrics } from '../interfaces/conversation-template.interface';

export const ConditionSchema = new mongoose.Schema(
    {
        field: {
            type: String,
            enum: [...Object.values(TemplateGroupField)]
        },
        values: [String],
        operator: {
            type: String,
            enum: [...Object.values(Operator)],
        },
    },
    { versionKey: false, _id: false },
)

export const ConversationTemplateSchema = new mongoose.Schema(
    {
        workspaceId: String,
        name: String,
        groupId: String,
        metric: {
            type: String,
            enum: [...Object.values(TemplateMetrics)],
        },
        groupField: {
            type: String,
            enum: [...Object.values(TemplateGroupField)]
        },
        chartType: {
            type: String,
            enum: [...Object.values(ChartType)]
        },
        interval: {
            type: String,
            enum: [...Object.values(AnalyticsInterval)]
        },
        conditions: [ConditionSchema],
        position: [Number],
        
    },
    { versionKey: false, collection: 'conversation_template', strictQuery: true },
);


// export const AttachmentModel: mongoose.Model<ConversationTemplate> = mongoose.model<ConversationTemplate>(
//     'ConversationTemplate',
//     ConversationTemplateSchema,
//     'conversation_template',
// );
