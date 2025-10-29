import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AgentContext } from '../../agent/interfaces/agent.interface';

export class DoQuestionDto {
    @ApiProperty()
    @IsString()
    contextId: string;

    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    fromInteractionId?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    botId?: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    fromAudio?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsObject()
    parameters?: Record<string, any>;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isStartMessage?: boolean;
}
