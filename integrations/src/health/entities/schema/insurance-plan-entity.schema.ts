import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IInsurancePlanEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type InsurancePlanEntityDocument = InsurancePlanEntity & Document;

@Schema({ collection: 'health_insurance_plan', versionKey: false, autoIndex: true })
export class InsurancePlanEntity extends Entity implements IInsurancePlanEntity {
  @Prop({ type: String, required: true })
  insuranceCode: string;
}

export const InsurancePlanEntitySchema = SchemaFactory.createForClass<InsurancePlanEntity>(InsurancePlanEntity);

InsurancePlanEntitySchema.index(defaultIndex);
InsurancePlanEntitySchema.index({
  integrationId: 1,
  insuranceCode: 1,
  order: -1,
  friendlyName: 1,
});
