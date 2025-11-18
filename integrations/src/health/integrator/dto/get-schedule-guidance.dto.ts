import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetScheduleGuidanceDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  @IsOptional()
  @ApiProperty()
  scheduleCodes?: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  @IsOptional()
  @ApiProperty()
  scheduleIds?: number[];
}
