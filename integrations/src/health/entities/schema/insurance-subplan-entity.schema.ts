import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IInsuranceSubPlanEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type InsuranceSubPlanEntityDocument = InsuranceSubPlanEntity & Document;

@Schema({ collection: 'health_insurance_subplan', versionKey: false, autoIndex: true })
export class InsuranceSubPlanEntity extends Entity implements IInsuranceSubPlanEntity {
  @Prop({ type: String, required: true })
  insuranceCode: string;

  @Prop({ type: String, required: true })
  insurancePlanCode: string;
}

export const InsuranceSubPlanEntitySchema =
  SchemaFactory.createForClass<InsuranceSubPlanEntity>(InsuranceSubPlanEntity);

InsuranceSubPlanEntitySchema.index(defaultIndex);
InsuranceSubPlanEntitySchema.index({
  integrationId: 1,
  insuranceCode: 1,
  insurancePlanCode: 1,
  order: -1,
  friendlyName: 1,
});
