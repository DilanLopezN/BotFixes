import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { GetScheduleByIdData } from '../interfaces/get-schedule-by-id.interface';

export class GetScheduleByIdDto implements GetScheduleByIdData {
  @IsString()
  @ApiProperty()
  scheduleId: number;
}
