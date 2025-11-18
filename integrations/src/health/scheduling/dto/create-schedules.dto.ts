import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { CreateScheduleInput, CreateScheduleOutput } from '../interfaces/create-schedule.interface';

export class CreateScheduleInputDto implements CreateScheduleInput {
  @ApiProperty()
  @IsString()
  patientErpCode: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientCpf?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientSex?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientBornDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientEmail?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientPhone?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientWeight?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  patientHeight?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty()
  @IsString()
  scheduleDate: string;

  @ApiProperty()
  @IsString()
  scheduleCode: string;
  data?: Record<string, string>;

  @ApiProperty()
  @IsString()
  insuranceCode: string;

  @ApiProperty()
  @IsString()
  insurancePlanCode: string;

  @ApiProperty()
  @IsString()
  insurancePlanCategoryCode: string;

  @ApiProperty()
  @IsString()
  organizationUnitCode: string;

  @ApiProperty()
  @IsString()
  procedureCode: string;

  @ApiProperty()
  @IsString()
  specialityCode: string;

  @ApiProperty()
  @IsString()
  specialityType: string;

  @ApiProperty()
  @IsString()
  doctorCode: string;

  @ApiProperty()
  @IsString()
  typeOfServiceCode: string;

  @ApiProperty()
  @IsString()
  appointmentTypeCode: string;

  @ApiProperty()
  @IsString()
  scheduleType: string;
}

export class CreateScheduleOutputDto implements CreateScheduleOutput {
  @ApiProperty()
  @IsString()
  scheduleCode: string;

  @ApiProperty()
  @IsString()
  duration: string;

  @ApiProperty()
  @IsString()
  scheduleDate: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  doctorCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  doctorName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  procedureCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  procedureName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  organizationUnitCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  organizationUnitName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  organizationUnitAdress?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insuranceCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insuranceName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  specialityCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  specialityName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insurancePlanCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insurancePlanName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insuranceSubPlanCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insuranceSubPlanName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  planCategoryCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  planCategoryName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  appointmentTypeCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  appointmentTypeName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  occupationAreaCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  occupationAreaName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  organizationUnitLocationCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  organizationUnitLocationName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  typeOfServiceCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  typeOfServiceName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  guidance?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  guidanceLink?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  warning?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isFollowUp?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  price?: string;

  @ApiProperty()
  @IsOptional()
  data?: any;
}
