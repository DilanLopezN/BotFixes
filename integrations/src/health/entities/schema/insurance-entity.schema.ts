import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ExternalInsurances } from '../../external-insurances/interfaces/external-insurances';
import { Document } from 'mongoose';
import { IInsuranceEntity } from '../../interfaces/entity.interface';
import { Entity, EntityParams } from './entity.schema';
import { defaultIndex } from './default-indexes';

export type InsuranceEntityDocument = InsuranceEntity & Document;

@Schema({ versionKey: false, _id: false })
export class InsuranceEntityParams extends EntityParams {
  @Prop({ type: Number, required: false, default: 0 })
  interAppointmentPeriod?: number;

  @Prop({ type: Boolean, required: false, default: false })
  isParticular?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  showAppointmentValue?: boolean;

  @Prop({ type: String, required: false, enum: ExternalInsurances })
  referenceInsuranceType?: ExternalInsurances;

  @Prop({ type: Boolean, required: false, default: false })
  includeInSuggestionsList?: boolean;
}

@Schema({ collection: 'health_insurance', versionKey: false, autoIndex: true })
export class InsuranceEntity extends Entity implements IInsuranceEntity {
  @Prop({ type: InsuranceEntityParams, required: false })
  params?: InsuranceEntityParams;
}

export const InsuranceEntitySchema = SchemaFactory.createForClass<InsuranceEntity>(InsuranceEntity);

InsuranceEntitySchema.index(defaultIndex);
