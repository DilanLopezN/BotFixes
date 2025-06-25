import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { BotAttribute } from '../interfaces/botAttribute.interface';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';

export const BotAttributesSchema = new mongoose.Schema(
  {
    name: String,
    interactions: [String],
    botId: Schema.Types.ObjectId,
    type: String,
    label: String,
    interactionId: String,
  },
  { versionKey: false, collection: 'bot_attributes', strictQuery: true },
);

BotAttributesSchema.plugin(AfterFindSoftDeletePlugin);
BotAttributesSchema.plugin(TimesmapPlugin);

export const BotAttributesModel: mongoose.Model<BotAttribute> = mongoose.model<
  BotAttribute
>('BotAttributes', BotAttributesSchema);
