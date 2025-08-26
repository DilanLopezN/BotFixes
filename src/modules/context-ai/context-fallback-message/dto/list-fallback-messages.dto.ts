import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListFallbackMessagesDto {
    @ApiProperty()
    @IsString()
    startDate: string;

    @ApiProperty()
    @IsString()
    endDate: string;

    @ApiPropertyOptional({
        description: 'Search text to filter messages',
        type: String,
        example: 'keyword',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Agent ID to filter messages',
        type: String,
        example: '507f1f77bcf86cd799439011',
    })
    @IsOptional()
    @IsString()
    agentId?: string;

    @ApiPropertyOptional({
        description: 'Number of items to skip for pagination',
        type: Number,
        example: 0,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(0)
    skip?: number;

    @ApiPropertyOptional({
        description: 'Maximum number of items to return',
        type: Number,
        example: 10,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    limit?: number;
}
