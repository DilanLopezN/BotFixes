import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray, IsObject } from 'class-validator';
import {
  ListAvailableSchedulesInput,
  ListAvailableSchedulesOutput,
  PeriodOfDay,
} from '../interfaces/available-schedules.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export class ListAvailableSchedulesInputDto implements ListAvailableSchedulesInput {
  @IsString()
  @ApiProperty({ required: true, description: 'Call ID', example: 'call-123' })
  callId: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ required: false })
  filter?: {
    doctorCode?: string;
    insuranceCode?: string;
    organizationUnitCode?: string;
    procedureCode?: string;
    specialityCode?: string;
    appointmentType?: string;
  };

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Start date in format YYYY/MM/DD HH:mm', example: '2024/01/15 09:00' })
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'End date in format YYYY/MM/DD HH:mm', example: '2024/01/20 18:00' })
  endDate?: string;
}

export class ScheduleDetailsDto {
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

export class ListAvailableSchedulesOutputDto implements ListAvailableSchedulesOutput {
  @IsNumber()
  @ApiProperty()
  count: number;

  @ApiProperty({ type: [ScheduleDetailsDto] })
  @IsArray()
  schedules: ScheduleDetailsDto[];
}
