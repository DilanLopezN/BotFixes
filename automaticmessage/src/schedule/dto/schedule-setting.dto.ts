import { ExtractRule } from '../models/schedule-setting.entity';
import { UpdateConfirmationSettingData } from '../interfaces/confirmation-setting-data.interface';
import { UpdateScheduleSettingData } from '../interfaces/schedule-setting-data.interface';
import { UpdateReminderSettingData } from '../interfaces/reminder-setting-data.interface';
import { UpdateSendSettingData } from '../interfaces/send-setting-data.interface';
import { CreateConfirmationSettingDto } from './confirmation-setting.dto';
import { CreateReminderSettingDto } from './reminder-setting.dto';
import { CreateSendSettingDto } from './send-setting.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleSettingDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'Interval to get schedules (in hours)' })
  @IsNumber()
  getScheduleInterval: number;

  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  @IsNotEmpty()
  integrationId: string;

  @ApiProperty({ description: 'Schedule setting name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Whether the setting is active' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'Time to extract schedules' })
  @IsNumber()
  extractAt: number;

  @ApiProperty({ description: 'Extraction rule', enum: ExtractRule })
  @IsEnum(ExtractRule)
  extractRule: ExtractRule;

  @ApiProperty({ description: 'Use speciality on exam message', required: false })
  @IsOptional()
  @IsBoolean()
  useSpecialityOnExamMessage?: boolean;

  @ApiProperty({ description: 'Send only principal exam', required: false })
  @IsOptional()
  @IsBoolean()
  sendOnlyPrincipalExam?: boolean;

  @ApiProperty({ description: 'Enable send retry', required: false })
  @IsOptional()
  @IsBoolean()
  enableSendRetry?: boolean;

  @ApiProperty({ description: 'Enable resend not answered', required: false })
  @IsOptional()
  @IsBoolean()
  enableResendNotAnswered?: boolean;

  @ApiProperty({ description: 'Use organization unit on group description', required: false })
  @IsOptional()
  @IsBoolean()
  useOrganizationUnitOnGroupDescription?: boolean;

  @ApiProperty({ description: 'Omit appointment type name', required: false })
  @IsOptional()
  @IsBoolean()
  omitAppointmentTypeName?: boolean;

  @ApiProperty({ description: 'Omit doctor name', required: false })
  @IsOptional()
  @IsBoolean()
  omitDoctorName?: boolean;

  @ApiProperty({ description: 'Omit extract guidance', required: false })
  @IsOptional()
  @IsBoolean()
  omitExtractGuidance?: boolean;

  @ApiProperty({ description: 'Friday join weekend monday', required: false })
  @IsOptional()
  @IsBoolean()
  fridayJoinWeekendMonday?: boolean;

  @ApiProperty({ description: 'Check schedule changes', required: false })
  @IsOptional()
  @IsBoolean()
  checkScheduleChanges?: boolean;

  @ApiProperty({ description: 'Omit time on group description', required: false })
  @IsOptional()
  @IsBoolean()
  omitTimeOnGroupDescription?: boolean;

  @ApiProperty({ description: 'Use is first come first served as time', required: false })
  @IsOptional()
  @IsBoolean()
  useIsFirstComeFirstServedAsTime?: boolean;

  @ApiProperty({ description: 'Time to resend not answered (in hours)', required: false })
  @IsOptional()
  @IsNumber()
  timeResendNotAnswered?: number;

  @ApiProperty({ description: 'Use send full day', required: false })
  @IsOptional()
  @IsBoolean()
  useSendFullDay?: boolean;

  @ApiProperty({ description: 'Use external extract', required: false })
  @IsOptional()
  @IsBoolean()
  externalExtract?: boolean;

  @ApiProperty({ description: 'Build description with address', required: false })
  @IsOptional()
  @IsBoolean()
  buildDescriptionWithAddress?: boolean;
}

export class UpdateScheduleSettingDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'Schedule setting ID' })
  @IsNumber()
  scheduleSettingId: number;

  @ApiProperty({ description: 'Interval to get schedules (in hours)' })
  @IsNumber()
  getScheduleInterval: number;

  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  @IsNotEmpty()
  integrationId: string;

  @ApiProperty({ description: 'Whether the setting is active' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'Schedule setting name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Time to extract schedules' })
  @IsNumber()
  extractAt: number;

  @ApiProperty({ description: 'Extraction rule', enum: ExtractRule })
  @IsEnum(ExtractRule)
  extractRule: ExtractRule;

  @ApiProperty({ description: 'Use speciality on exam message', required: false })
  @IsOptional()
  @IsBoolean()
  useSpecialityOnExamMessage?: boolean;

  @ApiProperty({ description: 'Send only principal exam', required: false })
  @IsOptional()
  @IsBoolean()
  sendOnlyPrincipalExam?: boolean;

  @ApiProperty({ description: 'Enable send retry', required: false })
  @IsOptional()
  @IsBoolean()
  enableSendRetry?: boolean;

  @ApiProperty({ description: 'Enable resend not answered', required: false })
  @IsOptional()
  @IsBoolean()
  enableResendNotAnswered?: boolean;

  @ApiProperty({ description: 'Use organization unit on group description', required: false })
  @IsOptional()
  @IsBoolean()
  useOrganizationUnitOnGroupDescription?: boolean;

  @ApiProperty({ description: 'Omit appointment type name', required: false })
  @IsOptional()
  @IsBoolean()
  omitAppointmentTypeName?: boolean;

  @ApiProperty({ description: 'Omit doctor name', required: false })
  @IsOptional()
  @IsBoolean()
  omitDoctorName?: boolean;

  @ApiProperty({ description: 'Omit extract guidance', required: false })
  @IsOptional()
  @IsBoolean()
  omitExtractGuidance?: boolean;

  @ApiProperty({ description: 'Friday join weekend monday', required: false })
  @IsOptional()
  @IsBoolean()
  fridayJoinWeekendMonday?: boolean;

  @ApiProperty({ description: 'Check schedule changes', required: false })
  @IsOptional()
  @IsBoolean()
  checkScheduleChanges?: boolean;

  @ApiProperty({ description: 'Omit time on group description', required: false })
  @IsOptional()
  @IsBoolean()
  omitTimeOnGroupDescription?: boolean;

  @ApiProperty({ description: 'Use is first come first served as time', required: false })
  @IsOptional()
  @IsBoolean()
  useIsFirstComeFirstServedAsTime?: boolean;

  @ApiProperty({ description: 'Time to resend not answered (in hours)', required: false })
  @IsOptional()
  @IsNumber()
  timeResendNotAnswered?: number;

  @ApiProperty({ description: 'Use send full day', required: false })
  @IsOptional()
  @IsBoolean()
  useSendFullDay?: boolean;

  @ApiProperty({ description: 'Use external extract', required: false })
  @IsOptional()
  @IsBoolean()
  externalExtract?: boolean;

  @ApiProperty({ description: 'Build description with address', required: false })
  @IsOptional()
  @IsBoolean()
  buildDescriptionWithAddress?: boolean;
}

export class ListScheduleSettingDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}

export class GetScheduleSettingByIdDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'Schedule setting ID' })
  @IsNumber()
  scheduleSettingId: number;
}

export class CreateAllSettingsDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'Schedule settings' })
  @ValidateNested()
  @Type(() => CreateScheduleSettingDto)
  schedule: CreateScheduleSettingDto;

  @ApiProperty({ description: 'Confirmation settings' })
  @ValidateNested()
  @Type(() => CreateConfirmationSettingDto)
  confirmation: CreateConfirmationSettingDto;

  @ApiProperty({ description: 'Reminder settings' })
  @ValidateNested()
  @Type(() => CreateReminderSettingDto)
  reminder: CreateReminderSettingDto;

  @ApiProperty({ description: 'Send settings', required: false, type: [CreateSendSettingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSendSettingDto)
  sendSettings?: CreateSendSettingDto[];
}

export class UpdateAllSettingsDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ description: 'Schedule setting ID' })
  @IsNumber()
  scheduleSettingId: number;

  @ApiProperty({ description: 'Schedule settings' })
  schedule: UpdateScheduleSettingData;

  @ApiProperty({ description: 'Confirmation settings' })
  confirmation: UpdateConfirmationSettingData;

  @ApiProperty({ description: 'Reminder settings' })
  reminder: UpdateReminderSettingData;

  @ApiProperty({ description: 'Send settings', required: false })
  @IsOptional()
  @IsArray()
  sendSettings?: UpdateSendSettingData[];
}