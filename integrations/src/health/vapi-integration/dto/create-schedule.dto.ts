import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { CreateScheduleInput, CreateScheduleOutput } from '../interfaces/create-schedule.interface';

export class CreateScheduleInputDto implements CreateScheduleInput {
  @ApiProperty()
  @IsString()
  patientErpCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientCpf?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientSex?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientBornDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientWeight?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientHeight?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty()
  @IsString()
  scheduleDate: string;

  @ApiProperty()
  @IsString()
  scheduleCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  data?: Record<string, string>;

  @ApiProperty()
  @IsString()
  insuranceCode: string;

  @ApiProperty()
  @IsString()
  insurancePlanCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insurancePlanCategoryCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insuranceSubPlanCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationUnitCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  procedureCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialityCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doctorCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  typeOfServiceCode?: string;

  @ApiProperty()
  @IsString()
  appointmentTypeCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scheduleType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lateralityCode?: string;
}

export class CreateScheduleOutputDto implements CreateScheduleOutput {
  @ApiProperty()
  @IsString()
  scheduleCode: string;

  @ApiProperty()
  @IsString()
  scheduleDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doctorCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doctorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  procedureCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  procedureName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationUnitCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationUnitName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationUnitAdress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insuranceCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insuranceName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialityCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialityName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insurancePlanCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insurancePlanName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insuranceSubPlanCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  insuranceSubPlanName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  planCategoryCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  planCategoryName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appointmentTypeCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appointmentTypeName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  occupationAreaCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  occupationAreaName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationUnitLocationCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationUnitLocationName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  typeOfServiceCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  typeOfServiceName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guidance?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guidanceLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warning?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isFollowUp?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  data?: any;
}
