import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  IIntegration,
  IntegrationEnvironment,
  IntegrationMessages,
  IntegrationPatientNameCase,
  IntegrationRules,
  IntegrationSyncType,
  RecoverAccessProtocol,
  RecoverAccessProtocolSteps,
  Routines,
  Scheduling,
  SchedulingGuidanceFormat,
} from '../interfaces/integration.interface';
import { IntegrationType } from '../../interfaces/integration-types';
import { Type } from 'class-transformer';
import { EntityType } from '../../interfaces/entity.interface';

export class IntegrationRulesDto {
  @IsBoolean()
  @IsOptional()
  [IntegrationRules.listOnlyDoctorsWithAvailableSchedules]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.listConsultationTypesAsProcedure]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.requiredTypeOfServiceOnCreateAppointment]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useProcedureWithoutSpecialityRelation]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useProcedureAsInterAppointmentValidation]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useOccupationAreaAsInterAppointmentValidation]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useDoctorAsInterAppointmentValidation]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useProcedureWithCompositeCode]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.sendGuidanceOnCreateSchedule]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.sendObservationOnListSchedules]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.splitInsuranceIntoInsurancePlans]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.splitInsuranceIntoInsurancePlansV2]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.updatePatientEmailBeforeCreateSchedule]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.updatePatientPhoneBeforeCreateSchedule]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.updatePatientSexBeforeCreateSchedule]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.usesCorrelation]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.showFutureSearchInAvailableScheduleList]?: boolean;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.timeBeforeTheAppointmentThatConfirmationCanBeMade]?: number;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.showListingFutureTimesFrom]?: number;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.runFirstScheduleRule]?: boolean;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.timeCacheFirstAppointmentAvailableForFutureSearches]?: number;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.limitUntilDaySearchAppointments]?: number;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.timeToIgnoreConflictingSchedules]?: number;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.limitUntilDaySearchAppointmentsWithDoctor]?: number;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.runInterAppointment]?: boolean;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.limitDaysForListDoctorsWithAvailableSchedules]?: number;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.timeFirstAvailableSchedule]?: number;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.showAnotherDoctorInTheListOfAvailableAppointments]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.listAvailableAppointmentFromAllActiveUnits]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.usesNightTimeInTheSelectionOfPeriod]?: boolean;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.limitOfDaysToSplitRequestInScheduleSearch]?: number;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.doNotAllowSameDayScheduling]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.doNotAllowSameDayAndDoctorScheduling]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.doNotAllowSameDayAndProcedureScheduling]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.doNotAllowSameHourScheduling]?: boolean;

  @IsNumber()
  @IsOptional()
  [IntegrationRules.minutesAfterAppointmentCanSchedule]?: number;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useInsuranceSuggestion]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useReportProcessorAISpecialityAndProcedureDetection]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useReportProcessorAIProcedureDetection]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useDoctorSuggestion]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useClinuxApiV2]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useNetpacsGroupedSchedules]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useNetpacsDoctorByProcedure]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useScheduledSending]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.doNotCancelBefore24hours]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useFeegowFilterDoctorsByInsurance]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.getPatientDoctorAttended]?: boolean;

  @IsOptional()
  @IsEnum(IntegrationPatientNameCase)
  @ApiProperty({ enum: IntegrationPatientNameCase })
  [IntegrationRules.patientNameCase]?: IntegrationPatientNameCase;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.allowStepBack]?: boolean;

  @IsBoolean()
  @IsOptional()
  [IntegrationRules.useListInAllSteps]?: boolean;
}

export class IntegrationMessagesDto {
  @IsString()
  @IsOptional()
  [IntegrationMessages.avaliableScheduleInList]?: string;

  @IsString()
  @IsOptional()
  [IntegrationMessages.procedureValueConfirmationStep]?: string;

  @IsString()
  @IsOptional()
  [IntegrationMessages.confirmSchedule]?: string;

  @IsString()
  @IsOptional()
  [IntegrationMessages.confirmScheduleWithLinkButtonTitle]?: string;

  @IsObject()
  @IsOptional()
  [IntegrationMessages.stepMessages]?: any;
}

export class IntegrationSchedulingConfigWhatsappDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  startSchedulingMessage?: string;

  @IsOptional()
  @IsString()
  startReschedulingMessage?: string;
}

export class IntegrationSchedulingConfigResourceCancellation {
  @IsOptional()
  @IsBoolean()
  enableScheduleCancellation?: boolean;

  @IsOptional()
  @IsNumber()
  hoursBeforeAppointmentToAllowCancellation?: number;
}

export class IntegrationSchedulingConfigResourceConfirmation {
  @IsOptional()
  @IsBoolean()
  enableScheduleConfirmation?: boolean;

  @IsOptional()
  @IsNumber()
  hoursBeforeAppointmentToAllowConfirmation?: number;
}

export class IntegrationSchedulingConfigResourceRescheduling {
  @IsOptional()
  @IsBoolean()
  enableScheduleRescheduling?: boolean;

  @IsOptional()
  @IsNumber()
  hoursBeforeAppointmentToAllowRescheduling?: number;
}

export class IntegrationSchedulingConfigResourcesDto {
  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationSchedulingConfigResourceCancellation)
  cancellation?: IntegrationSchedulingConfigResourceCancellation;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationSchedulingConfigResourceConfirmation)
  confirmation?: IntegrationSchedulingConfigResourceConfirmation;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationSchedulingConfigResourceRescheduling)
  rescheduling?: IntegrationSchedulingConfigResourceRescheduling;
}

export class IntegrationSchedulingConfig {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  friendlyName?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationSchedulingConfigWhatsappDto)
  whatsapp?: IntegrationSchedulingConfigWhatsappDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationSchedulingConfigResourcesDto)
  resources?: IntegrationSchedulingConfigResourcesDto;
}

export class IntegrationSchedulingDto implements Scheduling {
  @IsOptional()
  @IsString()
  identifier: string;

  @IsOptional()
  @IsEnum(SchedulingGuidanceFormat)
  @ApiProperty({ enum: SchedulingGuidanceFormat })
  guidanceFormatType: SchedulingGuidanceFormat;

  @IsBoolean()
  createScheduleNotification: boolean;

  @IsBoolean()
  createSchedulingLinkAfterCreateSchedule: boolean;

  @IsOptional()
  @Type(() => IntegrationSchedulingConfig)
  config?: IntegrationSchedulingConfig;
}

export class RecoverAccessProtocolDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  validateAllSteps?: boolean;

  @IsOptional()
  @IsEnum(RecoverAccessProtocolSteps)
  @ApiProperty({ enum: RecoverAccessProtocolSteps, isArray: true })
  steps?: RecoverAccessProtocolSteps[];
}

export class CreateIntegrationDto implements IIntegration {
  @IsString()
  @ApiProperty()
  _id: string;

  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  codeIntegration: string;

  @IsEnum(IntegrationType)
  @ApiProperty({ enum: IntegrationType })
  type: IntegrationType;

  @IsOptional()
  @ApiProperty()
  entitiesToSync: EntityType[];

  @IsOptional()
  @ApiProperty()
  entitiesFlow: EntityType[];

  @IsOptional()
  @ApiProperty()
  showExternalEntities: EntityType[];

  @IsOptional()
  @ApiProperty()
  steps: EntityType[];

  @IsString()
  @ApiProperty()
  workspaceId: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  syncStatus: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  lastSyncTimestamp: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  lastSyncEntities: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  lastSyncErrorTimestamp?: number;

  @IsBoolean()
  @ApiProperty()
  enabled: boolean;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationRulesDto)
  rules?: IntegrationRulesDto;

  @IsOptional()
  @IsEnum(IntegrationEnvironment)
  @ApiProperty({ enum: IntegrationEnvironment })
  environment: IntegrationEnvironment;

  @IsOptional()
  @IsEnum(IntegrationSyncType)
  @ApiProperty({ enum: IntegrationSyncType })
  syncType: IntegrationSyncType;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  debug?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  auditRequests?: boolean;

  @IsOptional()
  @ApiProperty()
  routines?: Routines;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationMessagesDto)
  messages?: IntegrationMessagesDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => IntegrationSchedulingDto)
  scheduling?: IntegrationSchedulingDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => RecoverAccessProtocolDto)
  recoverAccessProtocol?: RecoverAccessProtocol;
}
