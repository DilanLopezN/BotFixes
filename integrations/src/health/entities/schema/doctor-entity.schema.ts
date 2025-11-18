import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IDoctorEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type DoctorEntityDocument = DoctorEntity & Document;

@Schema({ collection: 'health_doctor', versionKey: false, autoIndex: true })
export class DoctorEntity extends Entity implements IDoctorEntity {}

export const DoctorEntitySchema = SchemaFactory.createForClass<DoctorEntity>(DoctorEntity);

DoctorEntitySchema.index(defaultIndex);
