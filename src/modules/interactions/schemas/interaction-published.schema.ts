import * as mongoose from 'mongoose';
import { Interaction } from '../interfaces/interaction.interface';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { interactionSchemaConfig } from './interaction.schema';

export const InteractionPublishedSchema = new mongoose.Schema(
    {
        ...interactionSchemaConfig,
    },
    {
        versionKey: false,
        collection: 'interactions_published',
        strictQuery: true,
    },
);

InteractionPublishedSchema.plugin(AfterFindSoftDeletePlugin);
InteractionPublishedSchema.plugin(TimesmapPlugin);

export const InteractionPublishedModel: mongoose.Model<Interaction> = mongoose.model<Interaction>('InteractionPublished', InteractionPublishedSchema);
