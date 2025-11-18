import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ITypeOfServiceEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity, EntityParams } from './entity.schema';

export enum TypeOfService {
  default = 'default',
  followUp = 'followUp',
  telemedicine = 'telemedicine',
  surgery = 'surgery',
  custom = 'custom',
  firstAppointment = 'firstAppointment',
}

export type TypeOfServiceEntityDocument = TypeOfServiceEntity & Document;

@Schema({ versionKey: false, _id: false })
export class TypeOfServiceEntityParams extends EntityParams {
  @Prop({ type: String, required: false, enum: TypeOfService })
  referenceTypeOfService?: TypeOfService;
}

@Schema({ collection: 'health_type_of_service', versionKey: false, autoIndex: true })
export class TypeOfServiceEntity extends Entity implements ITypeOfServiceEntity {
  @Prop({ type: TypeOfServiceEntityParams, required: false })
  params?: TypeOfServiceEntityParams;
}

export const TypeOfServiceEntitySchema = SchemaFactory.createForClass<TypeOfServiceEntity>(TypeOfServiceEntity);

TypeOfServiceEntitySchema.index(defaultIndex);
