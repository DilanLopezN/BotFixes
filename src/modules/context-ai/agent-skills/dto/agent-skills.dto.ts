import { IsBoolean, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SkillEnum } from '../skills/implementations';

export class CreateAgentSkillDto {
    @IsEnum(SkillEnum)
    @ApiProperty({ enum: SkillEnum })
    name: SkillEnum;

    @IsString()
    @ApiProperty()
    agentId: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    prompt?: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    isActive?: boolean;
}

export class UpdateAgentSkillDto extends CreateAgentSkillDto {
    @IsString()
    @ApiProperty()
    skillId: string;
}

export class DeleteAgentSkillDto {
    @IsString()
    @ApiProperty()
    skillId: string;

    @IsString()
    @ApiProperty()
    agentId: string;
}

export class GetAgentSkillDto {
    @IsString()
    @ApiProperty()
    skillId: string;

    @IsString()
    @ApiProperty()
    agentId: string;
}

export class ListAgentSkillsDto {
    @IsString()
    @ApiProperty({ required: true })
    agentId: string;
}
