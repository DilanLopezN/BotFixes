import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber, MaxLength, IsUUID, IsInt } from 'class-validator';

export class CreateConversationCategorizationParams {
    @ApiProperty({ type: String })
    @IsString()
    @IsUUID()
    conversationId: string;

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    @IsInt()
    objectiveId?: number;

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    @IsInt()
    outcomeId?: number;

    @ApiProperty({ type: String })
    @IsString()
    @IsUUID()
    userId: string;

    @ApiPropertyOptional({ type: String, maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    conversationTags?: string[];

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    message?: string;
}
