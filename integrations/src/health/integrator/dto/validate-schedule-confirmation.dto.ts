import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ValidateScheduleConfirmationDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  scheduleCode?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  scheduleId?: number;
}
