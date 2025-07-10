import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
    @IsNotEmpty()
    personality: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    prompt?: string;

    @ApiProperty()
    @IsString()
    botId: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
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
}
