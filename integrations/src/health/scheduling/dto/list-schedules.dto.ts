import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ListingType } from '../interfaces/list-schedules.interface';

export class ListSchedulesDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  scheduleCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  listingType?: ListingType;
}
