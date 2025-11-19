import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { EntityType } from '../../interfaces/entity.interface';
import { Document } from 'mongoose';
import { IntegrationType } from '../../interfaces/integration-types';
import {
  IIntegration,
  IntegrationEnvironment,
  IntegrationPatientNameCase,
  IntegrationSyncType,
  RecoverAccessProtocolSteps,
  SchedulingGuidanceFormat,
} from '../interfaces/integration.interface';
import { Types } from 'mongoose';
import { HealthEntityType } from 'kissbot-core';

export type IntegrationDocument = Integration & Document;

@Schema({ versionKey: false, _id: false })
class IntegrationMessages {
  @Prop({ type: String, required: false })
  confirmSchedule?: string;

  @Prop({ type: String, required: false })
  avaliableScheduleInList?: string;

  @Prop({ type: String, required: false })
  procedureValueConfirmationStep?: string;

  @Prop({ type: String, required: false })
  confirmScheduleWithLinkButtonTitle?: string;

  @Prop({ type: Object, required: false })
  stepMessages?: any;

  @Prop({ type: [String], enum: HealthEntityType, required: false })
  entitiesToExcludeFromConfirmationMessage?: HealthEntityType[];
}

@Schema({ versionKey: false, _id: false })
class IntegrationRules {
  @Prop({ type: Boolean, required: false, default: false })
  listConsultationTypesAsProcedure?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  listOnlyDoctorsWithAvailableSchedules?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  requiredTypeOfServiceOnCreateAppointment?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useProcedureWithoutSpecialityRelation?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useProcedureAsInterAppointmentValidation?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useOccupationAreaAsInterAppointmentValidation?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useDoctorAsInterAppointmentValidation?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useProcedureWithCompositeCode?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  sendGuidanceOnCreateSchedule?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  sendObservationOnListSchedules?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  splitInsuranceIntoInsurancePlans?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  splitInsuranceIntoInsurancePlansV2?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  updatePatientEmailBeforeCreateSchedule?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  updatePatientSexBeforeCreateSchedule?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  updatePatientPhoneBeforeCreateSchedule?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  usesCorrelation?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  showFutureSearchInAvailableScheduleList?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  runFirstScheduleRule?: boolean;

  @Prop({ type: Number, required: false })
  timeBeforeTheAppointmentThatConfirmationCanBeMade?: number;

  @Prop({ type: Number, required: false })
  showListingFutureTimesFrom?: number;

  @Prop({ type: Number, required: false })
  timeCacheFirstAppointmentAvailableForFutureSearches?: number;

  @Prop({ type: Number, required: false })
  limitUntilDaySearchAppointments?: number;

  @Prop({ type: Number, required: false })
  timeToIgnoreConflictingSchedules?: number;

  @Prop({ type: Number, required: false })
  limitDaysForListDoctorsWithAvailableSchedules?: number;

  @Prop({ type: Number, required: false })
  limitUntilDaySearchAppointmentsWithDoctor?: number;

  @Prop({ type: Boolean, required: false, default: false })
  runInterAppointment?: boolean;

  @Prop({ type: Number, required: false })
  timeFirstAvailableSchedule?: number;

  @Prop({ type: Boolean, required: false, default: true })
  showAnotherDoctorInTheListOfAvailableAppointments?: boolean;

  @Prop({ type: Boolean, required: false, default: true })
  listAvailableAppointmentFromAllActiveUnits?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  usesNightTimeInTheSelectionOfPeriod?: boolean;

  @Prop({ type: Number, required: false })
  limitOfDaysToSplitRequestInScheduleSearch?: number;

  @Prop({ type: Boolean, required: false, default: false })
  doNotAllowSameDayScheduling?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  doNotAllowSameDayAndDoctorScheduling?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  doNotAllowSameDayAndProcedureScheduling?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  doNotAllowSameHourScheduling?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  doNotAllowSameDayForProcedureWithLaterality?: boolean;

  @Prop({ type: Number, required: false })
  minutesAfterAppointmentCanSchedule?: number;

  @Prop({ type: Boolean, required: false, default: false })
  useInsuranceSuggestion?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useDoctorSuggestion?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useScheduleSuggestion?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useClinuxApiV2?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useNetpacsGroupedSchedules?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useNetpacsDoctorByProcedure?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useScheduledSending?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  doNotCancelBefore24hours?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useFeegowFilterDoctorsByInsurance?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  getPatientDoctorAttended?: boolean;

  @Prop({ type: String, enum: IntegrationPatientNameCase, required: false })
  patientNameCase?: IntegrationPatientNameCase;

  @Prop({ type: Boolean, required: false, default: false })
  allowStepBack?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useListInAllSteps?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useReportProcessorAISpecialityAndProcedureDetection?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  useReportProcessorAIProcedureDetection?: boolean;

  @Prop({ type: Boolean, required: false, default: true })
  useCachedEntitiesFromErp?: boolean;
}

@Schema({ versionKey: false, _id: false })
class Routines {
  @Prop({ type: Boolean, required: false })
  cronSearchAvailableSchedules?: boolean;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingConfigWhatsapp {
  @Prop({ type: String, required: false })
  phoneNumber?: string;

  @Prop({ type: String, required: false })
  startSchedulingMessage?: string;

  @Prop({ type: String, required: false })
  startReschedulingMessage?: string;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingConfigResourceCancellation {
  @Prop({ type: Boolean, required: false, default: false })
  enableScheduleCancellation?: boolean;

  @Prop({ type: Number, required: false })
  hoursBeforeAppointmentToAllowCancellation?: number;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingConfigResourceConfirmation {
  @Prop({ type: Boolean, required: false, default: false })
  enableScheduleConfirmation?: boolean;

  @Prop({ type: Number, required: false })
  hoursBeforeAppointmentToAllowConfirmation?: number;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingConfigResourceRescheduling {
  @Prop({ type: Boolean, required: false, default: false })
  enableScheduleRescheduling?: boolean;

  @Prop({ type: Number, required: false })
  hoursBeforeAppointmentToAllowRescheduling?: number;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingDocuments {
  @Prop({ type: Boolean, required: false })
  enableDocumentsUpload?: boolean;

  @Prop({ type: String, required: false })
  suporteMessage?: string;

  @Prop({ type: Number, required: false })
  documentsMaxSizeInMb?: number;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingConfigResources {
  @Prop({ type: IntegrationSchedulingConfigResourceCancellation, required: false })
  cancellation?: IntegrationSchedulingConfigResourceCancellation;

  @Prop({ type: IntegrationSchedulingConfigResourceConfirmation, required: false })
  confirmation?: IntegrationSchedulingConfigResourceConfirmation;

  @Prop({ type: IntegrationSchedulingConfigResourceRescheduling, required: false })
  rescheduling?: IntegrationSchedulingConfigResourceRescheduling;
}

@Schema({ versionKey: false, _id: false })
class IntegrationSchedulingConfig {
  @Prop({ type: String, required: false })
  name?: string;

  @Prop({ type: String, required: false })
  friendlyName?: string;

  @Prop({ type: String, required: false })
  logo?: string;

  @Prop({ type: IntegrationSchedulingConfigWhatsapp, required: false })
  whatsapp?: IntegrationSchedulingConfigWhatsapp;

  @Prop({ type: IntegrationSchedulingConfigResources, required: false })
  resources?: IntegrationSchedulingConfigResources;

  @Prop({ type: IntegrationSchedulingDocuments, required: false })
  documents?: IntegrationSchedulingDocuments;
}

@Schema({ versionKey: false, _id: false })
class IntegrationScheduling {
  @Prop({ type: String, required: false })
  identifier: string;

  @Prop({ type: String, enum: SchedulingGuidanceFormat })
  guidanceFormatType: SchedulingGuidanceFormat;

  @Prop({ type: Boolean, required: false, default: false })
  createSchedulingLinkAfterCreateSchedule: boolean;

  @Prop({ type: IntegrationSchedulingConfig, required: false })
  config?: IntegrationSchedulingConfig;

  @Prop({ type: Boolean, required: false, default: false })
  active: boolean;
}

@Schema({ versionKey: false, _id: false })
class RecoverAccessProtocol {
  @Prop({ type: Boolean, required: false })
  enabled?: boolean;

  @Prop({ type: [String], enum: RecoverAccessProtocolSteps, required: false })
  steps?: RecoverAccessProtocolSteps[];

  @Prop({ type: Boolean, required: false })
  validateAllSteps?: boolean;
}

@Schema({ versionKey: false, _id: false })
class IntegrationScheduleNotification {
  @Prop({ type: Boolean, required: false, default: false })
  createInternalNotificationAfterCreateSchedule: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  sendInternalNotificationForEachSchedule: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  createNotificationsFromImport: boolean;
}

@Schema({ versionKey: false, _id: false })
class IntegrationReportConfig {
  @Prop({ type: String, required: false, default: false })
  apiToken: string;
}

@Schema({ versionKey: false, _id: false })
class IntegrationDocumentsUpload {
  @Prop({ type: Boolean, required: false })
  enableDocumentsUpload?: boolean;

  @Prop({ type: Number, required: false })
  documentsMaxSizeInMb?: number;
}

@Schema({ collection: 'health_integrations', versionKey: false })
export class Integration implements IIntegration {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false })
  codeIntegration: string;

  @Prop({ type: String, enum: IntegrationType, required: true })
  type: IntegrationType;

  @Prop({ type: [String], enum: EntityType, required: false })
  entitiesToSync?: EntityType[];

  @Prop({ type: [String], enum: EntityType, required: false })
  entitiesFlow?: EntityType[];

  @Prop({ type: [String], enum: EntityType, required: false })
  showExternalEntities?: EntityType[];

  @Prop({ type: String, required: true })
  workspaceId: string;

  @Prop({ type: Number, required: false })
  syncStatus?: number;

  @Prop({ type: Boolean, required: true })
  enabled: boolean;

  @Prop({ type: Number, required: false })
  lastSyncErrorTimestamp?: number;

  @Prop({ type: Number, required: false })
  lastSyncEntities?: number;

  @Prop({ type: Number, required: false })
  lastSyncTimestamp?: number;

  @Prop({ type: String, required: false })
  apiToken: string;

  @Prop({ type: String, required: false })
  apiUsername?: string;

  @Prop({ type: String, required: false })
  apiPassword?: string;

  @Prop({ type: String, required: false })
  apiUrl: string;

  @Prop({ type: IntegrationRules, required: false })
  rules: IntegrationRules;

  @Prop({ type: String, required: false, default: IntegrationEnvironment.production, enum: IntegrationEnvironment })
  environment: IntegrationEnvironment;

  @Prop({ type: String, required: false, enum: IntegrationSyncType })
  syncType?: IntegrationSyncType;

  @Prop({ type: Boolean, required: false })
  debug?: boolean;

  @Prop({ type: Boolean, required: false })
  auditRequests?: boolean;

  @Prop({ type: IntegrationScheduling, required: false })
  scheduling: IntegrationScheduling;

  @Prop({ type: IntegrationScheduleNotification, required: false })
  scheduleNotification: IntegrationScheduleNotification;

  @Prop({ type: Routines, required: false })
  routines: Routines;

  @Prop({ type: IntegrationMessages, required: false })
  messages?: IntegrationMessages;

  @Prop({ type: RecoverAccessProtocol, required: false })
  recoverAccessProtocol?: RecoverAccessProtocol;

  @Prop({ type: IntegrationReportConfig, required: false })
  reportConfig?: IntegrationReportConfig;

  @Prop({ type: IntegrationDocumentsUpload, required: false })
  documents?: IntegrationDocumentsUpload;
}

export const IntegrationSchema = SchemaFactory.createForClass<Integration>(Integration);
