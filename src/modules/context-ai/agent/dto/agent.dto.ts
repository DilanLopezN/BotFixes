import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { AgentType } from '../entities/agent.entity';
import { AgentMode } from '../interfaces/agent.interface';

export class CreateAgentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsString()
    personality: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    prompt?: string;

    @ApiProperty()
    @IsString()
    botId: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @ApiProperty({ required: false, enum: AgentType })
    @IsEnum(AgentType)
    @IsOptional()
    agentType?: AgentType;

    @ApiProperty({ required: false, enum: AgentMode })
    @IsEnum(AgentMode)
    @IsOptional()
    agentMode?: AgentMode;

    @ApiProperty()
    @IsString()
    @IsOptional()
    modelName?: string;
}

export class UpdateAgentDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    agentId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    personality?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    prompt?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false, enum: AgentType })
    @IsEnum(AgentType)
    @IsOptional()
    agentType?: AgentType;
}

export class DeleteAgentDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    agentId: string;
}

export class GetAgentDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    agentId: string;
}

export class ListAgentsFilterDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    botId?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false, enum: AgentType })
    @IsEnum(AgentType)
    @IsOptional()
    agentType?: AgentType;
}
