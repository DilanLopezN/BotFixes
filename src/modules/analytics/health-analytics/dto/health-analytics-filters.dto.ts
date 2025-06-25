import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class HealthAnalyticsFiltersDto {
    @IsOptional()
    @IsString({ each: true })
    tags: string[];

    @IsOptional()
    @IsString()
    botId?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString({ each: true })
    teamIds?: string[];

    @IsOptional()
    @IsString({ each: true })
    channelIds?: string[];

    @IsOptional()
    @IsBoolean()
    ommitFields?: boolean;

    @IsOptional()
    @IsString({ each: true })
    pivotConfig?: string[];
}
