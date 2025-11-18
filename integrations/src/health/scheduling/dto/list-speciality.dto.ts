import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { SpecialityOutput } from '../interfaces/entities-output.interface';

export class ListSpecialityParamsDto extends DefaultEntitiesDto {}

export class ListSpecialityInputDto {
  @ValidateNested()
  @Type(() => ListSpecialityParamsDto)
  @ApiProperty({ type: ListSpecialityParamsDto })
  params: ListSpecialityParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListSpecialityOutputDto implements SpecialityOutput {
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
}
