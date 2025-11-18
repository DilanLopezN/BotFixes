import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IReasonEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type ReasonEntityDocument = ReasonEntity & Document;

@Schema({ collection: 'health_reason', versionKey: false, autoIndex: true })
export class ReasonEntity extends Entity implements IReasonEntity {}

export const ReasonEntitySchema = SchemaFactory.createForClass<ReasonEntity>(ReasonEntity);

ReasonEntitySchema.index(defaultIndex);
