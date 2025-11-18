import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ISpecialityEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type SpecialityEntityDocument = SpecialityEntity & Document;

@Schema({ collection: 'health_speciality', versionKey: false, autoIndex: true })
export class SpecialityEntity extends Entity implements ISpecialityEntity {
  @Prop({ type: String, required: true })
  specialityType: string;
}

export const SpecialityEntitySchema = SchemaFactory.createForClass<SpecialityEntity>(SpecialityEntity);

SpecialityEntitySchema.index(defaultIndex);
