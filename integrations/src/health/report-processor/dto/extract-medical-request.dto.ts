import { IsOptional, IsString, IsObject } from 'class-validator';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export class ExtractMedicalRequestQueryDto {
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsObject()
  filter?: CorrelationFilter;
}
