import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExtractType {
  schedule_notification = 'schedule_notification',
}

export class NotificationErpParamsDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  debugLimit?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  debugPhoneNumber?: number;

  @IsOptional()
  @ApiProperty()
  EXTRACT_TYPE?: ExtractType;
}

export class ListScheduleNotificationsDto {
  @IsString()
  @ApiProperty()
  startDate: string;

  @IsString()
  @ApiProperty()
  endDate: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  scheduleCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  page: number;

  @IsOptional()
  @IsObject()
  @ApiProperty({ type: NotificationErpParamsDto })
  erpParams?: NotificationErpParamsDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty()
  maxResults: number;
}
