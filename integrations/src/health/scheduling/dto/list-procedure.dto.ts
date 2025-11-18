import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { ProcedureOutput } from '../interfaces/entities-output.interface';

export class ListProcedureParamsDto extends DefaultEntitiesDto {}

export class ListProcedureInputDto {
  @ValidateNested()
  @Type(() => ListProcedureParamsDto)
  @ApiProperty({ type: ListProcedureParamsDto })
  params: ListProcedureParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListProcedureOutputDto implements ProcedureOutput {
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
  readonly specialityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly specialityCode: string;
}
