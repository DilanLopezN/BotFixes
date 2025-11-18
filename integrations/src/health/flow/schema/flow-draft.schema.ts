import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Flow } from './flow.schema';

export type FlowDraftDocument = FlowDraft & Document;

@Schema({ collection: 'health_flow_draft', versionKey: false, autoIndex: true })
export class FlowDraft extends Flow {}

export const FlowDraftSchema = SchemaFactory.createForClass<FlowDraft>(FlowDraft);

FlowDraftSchema.index(
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
