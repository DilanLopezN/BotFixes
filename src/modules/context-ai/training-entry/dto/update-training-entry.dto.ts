import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTrainingEntryDto {
    @ApiProperty()
    @IsString()
    trainingEntryId: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    botId?: string;

    @ApiProperty()
    @IsString()
    identifier: string;

    @ApiProperty()
    @IsString()
    @MaxLength(1_000)
    content: string;
}
