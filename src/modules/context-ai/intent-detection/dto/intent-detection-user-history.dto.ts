import { IsOptional, IsUUID, IsBoolean, IsDateString } from 'class-validator';

export class ListIntentDetectionUserHistoryDto {
    @IsUUID()
    @IsOptional()
    agentId?: string;

    @IsBoolean()
    @IsOptional()
    detected?: boolean;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}