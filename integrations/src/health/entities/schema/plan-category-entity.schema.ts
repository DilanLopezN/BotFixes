import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IInsurancePlanCategoryEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity } from './entity.schema';

export type PlanCategoryEntityDocument = PlanCategoryEntity & Document;

@Schema({ collection: 'health_plan_category', versionKey: false, autoIndex: true })
export class PlanCategoryEntity extends Entity implements IInsurancePlanCategoryEntity {
  @Prop({ type: String, required: true })
  insuranceCode: string;

  @Prop({ type: String, required: false })
  insurancePlanCode?: string;
}

export const PlanCategoryEntitySchema = SchemaFactory.createForClass<PlanCategoryEntity>(PlanCategoryEntity);

PlanCategoryEntitySchema.index(defaultIndex);
PlanCategoryEntitySchema.index({
  integrationId: 1,
  insuranceCode: 1,
  insurancePlanCode: 1,
  order: -1,
  friendlyName: 1,
});
