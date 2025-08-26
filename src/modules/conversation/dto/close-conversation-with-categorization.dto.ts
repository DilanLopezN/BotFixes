import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategorizationType } from '../../conversation-categorization-v2/interfaces/categorization-type';

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

    @ApiProperty({
        enum: CategorizationType,
        description: 'Tipo de categorização: USER, REMI, SYSTEM',
        default: CategorizationType.USER,
    })
    @IsEnum(CategorizationType)
    type: CategorizationType = CategorizationType.USER;

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
