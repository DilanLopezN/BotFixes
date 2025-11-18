import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { DoctorOutput } from '../interfaces/entities-output.interface';

export class ListDoctorParamsDto extends DefaultEntitiesDto {}

export class ListDoctorInputDto {
  @ValidateNested()
  @Type(() => ListDoctorParamsDto)
  @ApiProperty({ type: ListDoctorParamsDto })
  params: ListDoctorParamsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListDoctorOutputDto implements DoctorOutput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
