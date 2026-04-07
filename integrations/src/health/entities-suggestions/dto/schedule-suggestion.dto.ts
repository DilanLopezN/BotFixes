import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class ScheduleSuggestionDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxResults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timeRangeHours?: number;
}
