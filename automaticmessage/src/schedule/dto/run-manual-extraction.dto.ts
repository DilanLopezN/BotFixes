import { IsDate, IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';
import { RunManualExtractionData } from '../interfaces/run-manual-extraction-data.interface';
import { ExtractResumeType } from '../models/extract-resume.entity';

export class RunManualExtractionDto implements RunManualExtractionData {
  @IsDateString()
  extractEndDate: Date;
  @IsDateString()
  extractStartDate: Date;
  @IsEnum(ExtractResumeType)
  extractResumeType: ExtractResumeType;
  @IsNumber()
  scheduleSettingId: number;
  @IsString()
  workspaceId: string;
}
