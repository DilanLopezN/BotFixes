import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContextVariableType } from '../interfaces/context-variables.interface';

export class UpdateContextVariableDto {
    @ApiProperty()
    @IsString()
    contextVariableId: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    value: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    botId?: string;

    @ApiProperty()
    @IsString()
    agentId: string;

    @ApiProperty()
    @IsEnum(ContextVariableType)
    type: ContextVariableType;
}
