import * as mongoose from 'mongoose';
import { TemplateMessageSchema } from './template-message.schema';
import { TemplateMessageHistory } from '../interface/template-message-history.interface';
import { DatePlugin } from '../../../common/mongoosePlugins/date.plugin';

export const TemplateMessageHistorySchema = new mongoose.Schema(
    {},
    {
        collection: 'template_messages_history',
        versionKey: false,
        strictQuery: true,
    },
);

TemplateMessageHistorySchema.add(TemplateMessageSchema.clone());
TemplateMessageHistorySchema.add({
    templateMessageId: mongoose.Types.ObjectId,
    updatedByUserId: mongoose.Types.ObjectId,
});

TemplateMessageHistorySchema.remove(['createdAt', 'updatedAt']);
TemplateMessageHistorySchema.plugin(DatePlugin);

export const TeamHistoryModel: mongoose.Model<TemplateMessageHistory> = mongoose.model<TemplateMessageHistory>(
    'TemplateMessageHistory',
    TemplateMessageHistorySchema,
);
