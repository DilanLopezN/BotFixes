import { IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class SmtReAnalyticsDto {
    @IsOptional()
    @IsDateString()
    @ApiProperty()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    @ApiProperty()
    endDate?: string;

    @IsOptional()
    @IsArray()
    @ApiProperty()
    remiIdList?: string[];
}
