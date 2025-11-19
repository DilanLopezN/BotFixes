import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ILateralityEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type LateralityEntityDocument = LateralityEntity & Document;

@Schema({ collection: 'health_laterality', versionKey: false, autoIndex: true })
export class LateralityEntity extends Entity implements ILateralityEntity {}

export const LateralityEntitySchema = SchemaFactory.createForClass<LateralityEntity>(LateralityEntity);

LateralityEntitySchema.index(defaultIndex);
