import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { TypeOfServiceOutput } from '../interfaces/entities-output.interface';

export class ListTypeOfServiceParamsDto extends DefaultEntitiesDto {}

export class ListTypeOfServiceInputDto {
  @ValidateNested()
  @Type(() => ListTypeOfServiceParamsDto)
  @ApiProperty({ type: ListTypeOfServiceParamsDto })
  params: ListTypeOfServiceParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListTypeOfServiceOutputDto implements TypeOfServiceOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
