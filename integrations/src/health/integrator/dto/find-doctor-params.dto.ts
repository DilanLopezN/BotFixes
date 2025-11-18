import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { FindDoctorParams } from 'kissbot-health-core';

export class FindDoctorDto implements FindDoctorParams {
  @IsOptional()
  @IsString()
  @ApiProperty()
  docNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  phone?: string[];
}
