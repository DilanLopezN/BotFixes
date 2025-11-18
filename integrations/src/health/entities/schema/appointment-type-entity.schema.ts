import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IAppointmentTypeEntity } from '../../interfaces/entity.interface';
import { defaultIndex } from './default-indexes';
import { Entity, EntityParams } from './entity.schema';

export enum ScheduleType {
  Exam = 'E',
  Consultation = 'C',
  FollowUp = 'R',
}

export type AppointmentTypeEntityDocument = AppointmentTypeEntity & Document;

@Schema({ versionKey: false, _id: false })
export class AppointmentTypeEntityParams extends EntityParams {
  @Prop({ type: String, required: false, enum: ScheduleType })
  referenceScheduleType?: ScheduleType;
}

@Schema({ collection: 'health_appointment_types', versionKey: false, autoIndex: true })
export class AppointmentTypeEntity extends Entity implements IAppointmentTypeEntity {
  @Prop({ type: AppointmentTypeEntityParams, required: false })
  params?: AppointmentTypeEntityParams;
}

export const AppointmentTypeEntitySchema = SchemaFactory.createForClass<AppointmentTypeEntity>(AppointmentTypeEntity);

AppointmentTypeEntitySchema.index(defaultIndex);
