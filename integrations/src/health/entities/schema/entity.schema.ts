import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Integration } from '../../integration/schema/integration.schema';
import {
  EntitySourceType,
  EntityType,
  EntityVersionType,
  IEntity,
  IEntityReference,
} from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';

export type EntityDocument = Entity & Document;

@Schema({ versionKey: false, _id: false })
export class EntityParams {
  @Prop({ type: Number, required: false })
  minimumAge?: number;

  @Prop({ type: Number, required: false })
  maximumAge?: number;
}

@Schema({ collection: 'health_entity', versionKey: false, autoIndex: true })
export class Entity implements IEntity {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false })
  friendlyName?: string;

  @Prop({ type: [String], required: false })
  synonyms?: string[];

  @Prop({ type: [String], required: false })
  internalSynonyms?: string[];

  @Prop({ type: Boolean, required: false })
  activeErp: boolean;

  @Prop({ type: Number, enum: EntitySourceType })
  source: EntitySourceType;

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: Types.ObjectId, ref: Integration.name })
  integrationId: Types.ObjectId;

  @Prop({ type: String, enum: EntityVersionType })
  version: EntityVersionType;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  data: MongooseSchema.Types.Mixed;

  @Prop({
    type: [{ refId: Types.ObjectId, type: { enum: EntityType, type: String } }],
    required: false,
    _id: false,
    versionKey: false,
  })
  references: IEntityReference[];

  @Prop({ type: EntityParams, required: false })
  params?: EntityParams;

  @Prop({ type: Boolean, required: false })
  canSchedule?: boolean;

  @Prop({ type: Boolean, required: false })
  canReschedule?: boolean;

  @Prop({ type: Boolean, required: false })
  canConfirmActive?: boolean;

  @Prop({ type: Boolean, required: false })
  canConfirmPassive?: boolean;

  @Prop({ type: Boolean, required: false })
  canCancel: boolean;

  @Prop({ type: Boolean, required: false })
  canView?: boolean;

  @Prop({ type: Number, required: false })
  embeddingsSyncAt?: number;

  @Prop({ type: Number, required: false })
  createdAt: number;

  @Prop({ type: Number, required: false })
  updatedAt: number;
}

export const EntitySchema = SchemaFactory.createForClass<Entity>(Entity);

EntitySchema.index(defaultIndex);
