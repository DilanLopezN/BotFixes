import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum GroupDateType {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
}

export enum GroupBy {
    TEAM = 'team',
    USER = 'user',
}

export class AgentStatusAnalyticsFilterDto {
    @IsOptional()
    @IsString()
    teamId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsEnum(GroupDateType)
    groupDateBy?: GroupDateType;

    @IsOptional()
    @IsEnum(GroupBy)
    groupBy?: GroupBy;

    @IsOptional()
    @IsNumber()
    breakSettingId?: number;
}

export class AgentStatusAnalyticsFilterListBreakOvertimeDto {
    @IsOptional()
    @IsString()
    teamId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsNumber()
    breakSettingId?: number;
}
