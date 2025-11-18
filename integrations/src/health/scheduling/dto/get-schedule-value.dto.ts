import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { GetScheduleValueInput, GetScheduleValueOutput } from '../interfaces/get-schedule-value.interface';

export class GetScheduleValueInputDto implements GetScheduleValueInput {
  @ApiProperty()
  @IsString()
  insuranceCode: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insurancePlanCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  insuranceSubPlanCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  planCategoryCode?: string;

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
  @IsOptional()
  @IsString()
  doctorCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  appontmentTypeCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  organizationUnitCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  scheduleCode?: string;

  @ApiProperty()
  @IsOptional()
  data?: any;
}

export class GetScheduleValueOutputDto implements GetScheduleValueOutput {
  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  value: string;
}
