import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IOccupationAreaEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity, EntityParams } from './entity.schema';

export type OccupationAreaEntityDocument = OccupationAreaEntity & Document;

@Schema({ versionKey: false, _id: false })
export class OccupationAreaEntityParams extends EntityParams {
  @Prop({ type: Boolean, required: false, default: true })
  hasRelationshipWithDoctors?: boolean;
}

@Schema({ collection: 'health_occupation_area', versionKey: false, autoIndex: true })
export class OccupationAreaEntity extends Entity implements IOccupationAreaEntity {
  @Prop({ type: OccupationAreaEntityParams, required: false, default: {} })
  params?: OccupationAreaEntityParams;
}

export const OccupationAreaEntitySchema = SchemaFactory.createForClass<OccupationAreaEntity>(OccupationAreaEntity);

OccupationAreaEntitySchema.index(defaultIndex);
