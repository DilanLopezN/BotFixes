import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IProcedureEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type ProcedureEntityDocument = ProcedureEntity & Document;

@Schema({ collection: 'health_procedure', versionKey: false, autoIndex: true })
export class ProcedureEntity extends Entity implements IProcedureEntity {
  @Prop({ type: String, required: true })
  specialityCode: string;

  @Prop({ type: String, required: true })
  specialityType: string;

  @Prop({ type: String, required: false })
  tuss: string;

  @Prop({ type: String, required: false })
  guidance: string;
}

export const ProcedureEntitySchema = SchemaFactory.createForClass<ProcedureEntity>(ProcedureEntity);

ProcedureEntitySchema.index(defaultIndex);
