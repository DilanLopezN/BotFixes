import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetTraceDto {
    @ApiProperty()
    @IsUUID()
    traceId: string;
}

export class GetTracesByContextDto {
    @ApiProperty()
    @IsString()
    contextId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class GetContextStatisticsDto {
    @ApiProperty()
    @IsString()
    contextId: string;
}
