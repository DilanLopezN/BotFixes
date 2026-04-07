import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { InsuranceOutput } from '../interfaces/entities-output.interface';

export class ListInsuranceParamsDto extends DefaultEntitiesDto {}

export class ListInsuranceInputDto {
  @ValidateNested()
  @Type(() => ListInsuranceParamsDto)
  @ApiProperty({ type: ListInsuranceParamsDto })
  params: ListInsuranceParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListInsuranceOutputDto implements InsuranceOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly isParticular: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly showProcedureValue: boolean;
}
