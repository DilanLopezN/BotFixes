import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultEntitiesDto } from './default-entities.dto';
import { AppointmentTypeOutput } from '../interfaces/entities-output.interface';

export class ListAppointmentTypeParmsDto extends DefaultEntitiesDto {}

export class ListAppointmentTypeInputDto {
  @ValidateNested()
  @Type(() => ListAppointmentTypeParmsDto)
  @ApiProperty({ type: ListAppointmentTypeParmsDto })
  params: ListAppointmentTypeParmsDto;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  offset?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  limit?: number;
}

export class ListAppointmentTypeOutputDto implements AppointmentTypeOutput {
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
  readonly referenceScheduleType: string;
}
