import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { InsuranceSubPlanOutput } from '../interfaces/entities-output.interface';

export class ListInsuranceSubPlanParamsDto extends DefaultEntitiesDto {}

export class ListInsuranceSubPlanInputDto {
  @ValidateNested()
  @Type(() => ListInsuranceSubPlanParamsDto)
  @ApiProperty({ type: ListInsuranceSubPlanParamsDto })
  params: ListInsuranceSubPlanParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListInsuranceSubPlanOutputDto implements InsuranceSubPlanOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly insuranceCode: string;
}
