import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsDateString, IsBoolean } from 'class-validator';

export class UpdateTrainingEntryDto {
    @ApiProperty()
    @IsString()
    trainingEntryId: string;

    @ApiProperty()
    @IsString()
    agentId: string;

    @ApiProperty()
    @IsString()
    identifier: string;

    @ApiProperty()
    @IsString()
    @MaxLength(1_000)
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    trainingEntryTypeId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
