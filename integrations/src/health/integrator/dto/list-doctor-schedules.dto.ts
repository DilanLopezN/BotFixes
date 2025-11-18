import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ListDoctorSchedulesParams } from 'kissbot-health-core';

export class ListDoctorSchedulesDto implements ListDoctorSchedulesParams {
  @IsString()
  @ApiProperty()
  date: string;

  @IsString()
  @ApiProperty()
  doctorCode: string;
}
