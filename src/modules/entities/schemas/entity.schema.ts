import * as mongoose from 'mongoose';
import { Entity } from '../interfaces/entity.interface';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { Schema } from 'mongoose';

export const EntityAttributeSchema = new mongoose.Schema(
    {
        name: String,
        type: String,
        id: String,
    },
    { versionKey: false, _id: false},
);

export const EntryAttribute = new mongoose.Schema(
    {
        value: String,
        entityAttributeId: String
    },
    { versionKey: false, _id: false},
);

export const EntrySchema = new mongoose.Schema(
    {
        name: String,
        synonyms: [String],
        entryAttributes: [EntryAttribute],
    },
    { versionKey: false, _id: false},
);

export const EntitySchema = new mongoose.Schema(
  {
    workspaceId: Schema.Types.ObjectId,
    name: String,
    entityAttributes: [EntityAttributeSchema],
    entries: [EntrySchema],
    params: Schema.Types.Mixed,
  },
  { versionKey: false, collection: 'entities', strictQuery: true },
);

EntitySchema.plugin(AfterFindSoftDeletePlugin);
EntitySchema.plugin(TimesmapPlugin);

export const EntityModel: mongoose.Model<Entity> = mongoose.model<Entity>(
  'Entity',
  EntitySchema,
);
