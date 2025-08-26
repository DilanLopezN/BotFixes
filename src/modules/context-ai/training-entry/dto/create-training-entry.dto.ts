import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTrainingEntryDto {
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
}
