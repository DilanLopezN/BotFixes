import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContextVariableType } from '../interfaces/context-variables.interface';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContextVariablesDto {
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
    @IsEnum(ContextVariableType)
    type: ContextVariableType;
}
