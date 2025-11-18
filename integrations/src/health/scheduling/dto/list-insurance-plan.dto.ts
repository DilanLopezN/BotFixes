import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { InsurancePlanOutput } from '../interfaces/entities-output.interface';

export class ListInsurancePlanParamsDto extends DefaultEntitiesDto {}

export class ListInsurancePlanInputDto {
  @ValidateNested()
  @Type(() => ListInsurancePlanParamsDto)
  @ApiProperty({ type: ListInsurancePlanParamsDto })
  params: ListInsurancePlanParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListInsurancePlanOutputDto implements InsurancePlanOutput {
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
