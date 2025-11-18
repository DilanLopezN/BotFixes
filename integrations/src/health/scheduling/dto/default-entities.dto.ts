import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DefaultEntitiesDto {
  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  organizationUnitCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  organizationUnitLocationCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  specialityCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  insuranceCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  insurancePlanCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  insuranceCategoryCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  insuranceSubPlanCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  occupationAreaCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  typeOfServiceCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  procedureCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  appointmentTypeCode?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true })
  doctorCode?: string;
}
