import { IsDate, IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';
import { RunManualExtractionData } from '../interfaces/run-manual-extraction-data.interface';

export class RunManualExtractionDto implements RunManualExtractionData {
    @IsDateString()
    extractEndDate: Date;
    @IsDateString()
    extractStartDate: Date;
    @IsString()
    extractResumeType: string;
    @IsNumber()
    scheduleSettingId: number;
}
