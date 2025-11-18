import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import {
  FlowAction,
  FlowActionType,
  FlowPeriodOfDay,
  FlowType,
  FlowSteps,
  FlowTriggerType,
} from '../interfaces/flow.interface';

class FlowActionDto {
  @IsEnum(FlowActionType)
  @ApiProperty({ enum: FlowActionType })
  type: FlowActionType;

  @ApiProperty()
  element: any;
}

export class CreateFlowDto {
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  organizationUnitId: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  insuranceId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  insurancePlanId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  insuranceSubPlanId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  planCategoryId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  specialityId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  procedureId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  doctorId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  appointmentTypeId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  occupationAreaId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  organizationUnitLocationId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  typeOfServiceId?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty()
  reasonId?: string[];

  @IsNumber()
  @ApiProperty()
  integrationId: string;

  @ApiProperty({ type: FlowActionDto })
  @ValidateNested({ each: true })
  @Type(() => FlowActionDto)
  actions?: FlowAction[];

  @IsString()
  @IsOptional()
  @ApiProperty()
  deletedAt?: string;

  @IsEnum(FlowSteps, { each: true })
  @ApiProperty({ enum: FlowSteps, isArray: true })
  step: FlowSteps[];

  @IsEnum(FlowType)
  @ApiProperty({ enum: FlowType })
  type: FlowType;

  @IsEnum(FlowPeriodOfDay)
  @IsOptional()
  @ApiProperty({ enum: FlowPeriodOfDay })
  periodOfDay?: FlowPeriodOfDay;

  @IsNumber()
  @IsOptional()
  minimumAge?: number;

  @IsNumber()
  @IsOptional()
  maximumAge?: number;

  @IsBoolean()
  @IsOptional()
  inactive?: boolean;

  @IsString()
  @IsOptional()
  sex?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @ApiProperty()
  _id: string;

  @IsString({ each: true })
  @ApiProperty()
  cpfs?: string[];

  @IsNumber()
  @IsOptional()
  executeFrom?: number;

  @IsNumber()
  @IsOptional()
  executeUntil?: number;

  @IsNumber()
  @IsOptional()
  runBetweenStart?: number;

  @IsNumber()
  @IsOptional()
  runBetweenEnd?: number;

  @IsEnum(FlowTriggerType)
  @IsOptional()
  @ApiProperty({ enum: FlowTriggerType })
  trigger?: FlowTriggerType[];

  @IsString()
  @IsOptional()
  @ApiProperty()
  updatedByUserId?: string;
}
