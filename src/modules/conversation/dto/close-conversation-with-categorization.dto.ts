import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseConversationWithCategorizationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    objectiveId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    outcomeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    conversationTags?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(4096)
    message?: string;
}
