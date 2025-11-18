import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import {
  FlowAction,
  FlowActionElement,
  FlowActionType,
  FlowPeriodOfDay,
  FlowType,
  FlowSteps,
  FlowTriggerType,
} from '../interfaces/flow.interface';

export type FlowDocument = Flow & Document;

@Schema({ _id: false, versionKey: false })
export class FlowActions {
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  element: FlowActionElement;

  @Prop({ enum: FlowActionType, type: String, required: true })
  type: FlowActionType;
}

export const FlowActionsSchema = SchemaFactory.createForClass(FlowActions);

@Schema({ collection: 'health_flow', versionKey: false, autoIndex: true })
export class Flow {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false })
  integrationId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], required: false })
  appointmentTypeId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  doctorId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  groupId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  procedureId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  specialityId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  insurancePlanId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  insuranceSubPlanId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  planCategoryId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  insuranceId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  organizationUnitId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  occupationAreaId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  typeOfServiceId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  organizationUnitLocationId?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], required: false })
  reasonId?: Types.ObjectId[];

  @Prop({ enum: FlowSteps, type: [String] })
  step?: FlowSteps[];

  @Prop({ enum: FlowType, type: String })
  type?: FlowType;

  @Prop({ type: [FlowActionsSchema], required: false })
  actions?: FlowAction[];

  @Prop({ type: Number, required: false })
  deletedAt?: number;

  @Prop({ type: Number, required: false })
  updatedAt?: number;

  @Prop({ type: String, required: false })
  updatedByUserId?: string;

  @Prop({ type: Number, required: true })
  createdAt: number;

  @Prop({ type: Boolean, required: false })
  inactive: boolean;

  @Prop({ type: Number, required: false })
  minimumAge?: number;

  @Prop({ type: Number, required: false })
  maximumAge?: number;

  @Prop({ enum: FlowPeriodOfDay, type: Number })
  periodOfDay?: number;

  @Prop({ type: String, required: false })
  patientSex?: string;

  @Prop({ type: [String], required: false, default: [] })
  cpfs?: string[];

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: Number, required: false })
  executeFrom?: number;

  @Prop({ type: Number, required: false })
  executeUntil?: number;

  @Prop({ type: Number, required: false })
  runBetweenStart?: number;

  @Prop({ type: Number, required: false })
  runBetweenEnd?: number;

  @Prop({ enum: FlowTriggerType, type: [String] })
  trigger?: FlowTriggerType[];

  @Prop({ type: Number, required: false })
  publishedAt: number;
}

export const FlowSchema = SchemaFactory.createForClass<Flow>(Flow);

FlowSchema.index(
  {
    integrationId: 1,
    type: 1,
    step: 1,
  },
  {
    partialFilterExpression: {
      deletedAt: { $eq: null },
    },
  },
);
