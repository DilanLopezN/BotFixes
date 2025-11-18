import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { OccupationAreaOutput } from '../interfaces/entities-output.interface';

export class ListOccupationAreaParamsDto extends DefaultEntitiesDto {}

export class ListOccupationAreaInputDto {
  @ValidateNested()
  @Type(() => ListOccupationAreaParamsDto)
  @ApiProperty({ type: ListOccupationAreaParamsDto })
  params: ListOccupationAreaParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListOccupationAreaOutputDto implements OccupationAreaOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
