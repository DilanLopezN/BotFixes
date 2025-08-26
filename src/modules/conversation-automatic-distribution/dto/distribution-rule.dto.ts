import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDistributionRuleDto {
    @ApiProperty({
        description: 'Whether the distribution rule is active',
        example: true,
    })
    @IsBoolean()
    active: boolean;

    @ApiProperty({
        description: 'Maximum number of conversations per agent',
        example: 5,
        minimum: 1,
    })
    @IsNumber()
    @Min(1)
    maxConversationsPerAgent: number;

    @ApiPropertyOptional({
        description: 'Check if user was on conversation before distribution',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    checkUserWasOnConversation?: boolean;

    @ApiPropertyOptional({
        description: 'Check team working time for conversation distribution',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    checkTeamWorkingTimeConversation?: boolean;
}

export class UpdateDistributionRuleDto {
    @ApiPropertyOptional({
        description: 'Whether the distribution rule is active',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional({
        description: 'Maximum number of conversations per agent',
        example: 5,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxConversationsPerAgent?: number;

    @ApiPropertyOptional({
        description: 'Check if user was on conversation before distribution',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    checkUserWasOnConversation?: boolean;

    @ApiPropertyOptional({
        description: 'Check team working time for conversation distribution',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    checkTeamWorkingTimeConversation?: boolean;
}

export class DistributionRuleResponseDto {
    @ApiPropertyOptional({
        description: 'Distribution rule ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id?: string;

    @ApiProperty({
        description: 'Workspace ID',
        example: '507f1f77bcf86cd799439012',
    })
    workspaceId: string;

    @ApiProperty({
        description: 'Whether the distribution rule is active',
        example: true,
    })
    active: boolean;

    @ApiProperty({
        description: 'Maximum number of conversations per agent',
        example: 5,
    })
    maxConversationsPerAgent: number;

    @ApiPropertyOptional({
        description: 'Check if user was on conversation before distribution',
        example: false,
        default: false,
    })
    checkUserWasOnConversation?: boolean;

    @ApiPropertyOptional({
        description: 'Check team working time for conversation distribution',
        example: false,
        default: false,
    })
    checkTeamWorkingTimeConversation?: boolean;

    @ApiPropertyOptional({
        description: 'Creation date',
        example: '2024-01-01T12:00:00.000Z',
    })
    createdAt?: Date;

    @ApiPropertyOptional({
        description: 'Last update date',
        example: '2024-01-01T12:00:00.000Z',
    })
    updatedAt?: Date;
}

export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Number of items to skip for pagination',
        example: 0,
        minimum: 0,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(0)
    skip?: number;

    @ApiPropertyOptional({
        description: 'Maximum number of items to return',
        example: 10,
        minimum: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    limit?: number;
}

export class PaginatedDistributionRulesResponseDto {
    @ApiProperty({
        description: 'List of distribution rules',
        type: [DistributionRuleResponseDto],
    })
    data: DistributionRuleResponseDto[];

    @ApiProperty({
        description: 'Total number of distribution rules',
        example: 50,
    })
    total: number;

    @ApiProperty({
        description: 'Number of items skipped',
        example: 0,
    })
    skip: number;

    @ApiProperty({
        description: 'Maximum number of items per page',
        example: 10,
    })
    limit: number;
}
