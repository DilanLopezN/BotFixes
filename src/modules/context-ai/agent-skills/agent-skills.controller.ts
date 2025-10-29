import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../common/interfaces/default';
import { AgentSkillsService } from './agent-skills.service';
import { CreateAgentSkillDto, DeleteAgentSkillDto, GetAgentSkillDto, ListAgentSkillsDto, UpdateAgentSkillDto } from './dto/agent-skills.dto';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { IAgentSkills } from './entities/agent-skills.entity';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@ApiTags('Agent Skills')
@Controller('workspaces/:workspaceId/conversation-ai/agent-skills')
export class AgentSkillsController {
    constructor(private readonly agentSkillsService: AgentSkillsService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createAgentSkill')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createAgentSkill(
        @Body(new ValidationPipe()) dto: CreateAgentSkillDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IAgentSkills>> {
        const createData = {
            ...dto,
            workspaceId,
        };
        const agentSkill = await this.agentSkillsService.create(createData);
        return { data: agentSkill };
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateAgentSkill')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateAgentSkill(@Body(new ValidationPipe()) dto: UpdateAgentSkillDto): Promise<DefaultResponse<IAgentSkills>> {
        const agentSkill = await this.agentSkillsService.update(dto.skillId, dto);
        return { data: agentSkill };
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteAgentSkill')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteAgentSkill(@Body(new ValidationPipe()) dto: DeleteAgentSkillDto): Promise<DefaultResponse<{ ok: boolean }>> {
        const result = await this.agentSkillsService.delete(dto.skillId);
        return { data: { ok: !!result } };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getAgentSkill')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getAgentSkillById(@Body(new ValidationPipe()) dto: GetAgentSkillDto): Promise<DefaultResponse<IAgentSkills>> {
        const agentSkill = await this.agentSkillsService.findOne({ _id: dto.skillId });
        return { data: agentSkill };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listAgentSkills')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listAgentSkills(
        @Body(new ValidationPipe()) dto: ListAgentSkillsDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IAgentSkills[]>> {
        const agentSkills = await this.agentSkillsService.getAgentSkills(workspaceId, dto.agentId);
        return { data: agentSkills };
    }
}