import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DoQuestionDto {
    @ApiProperty()
    @IsString()
    contextId: string;

    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty()
    @IsBoolean()
    useHistoricMessages: boolean;

    @ApiProperty()
    @IsOptional()
    @IsString()
    fromInteractionId?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    botIdId?: string;
}
