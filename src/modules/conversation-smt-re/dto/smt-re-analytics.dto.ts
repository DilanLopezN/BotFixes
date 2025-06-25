import { IsOptional, IsDateString } from 'class-validator';

export class SmtReAnalyticsDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}