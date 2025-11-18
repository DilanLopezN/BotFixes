import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CancelScheduleDto {
  @IsString()
  @ApiProperty()
  scheduleCode: string;

  @IsOptional()
  @IsObject()
  @ApiProperty()
  data?: any;
}
