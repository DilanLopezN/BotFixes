import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { AgentService } from '../services/agent.service';
import { CreateAgentDto, DeleteAgentDto, GetAgentDto, ListAgentsFilterDto, UpdateAgentDto } from '../dto/agent.dto';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IAgent } from '../interfaces/agent.interface';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@ApiTags('Agent')
@Controller('workspaces/:workspaceId/conversation-ai/agent')
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createAgent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createAgent(
        @Body(new ValidationPipe()) dto: CreateAgentDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IAgent>> {
        const createData = {
            ...dto,
            workspaceId,
        };
        const agent = await this.agentService.create(createData);
        return { data: agent };
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateAgent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateAgent(@Body(new ValidationPipe()) dto: UpdateAgentDto): Promise<DefaultResponse<IAgent>> {
        const agent = await this.agentService.update(dto);
        return { data: agent };
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteAgent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteAgent(@Body(new ValidationPipe()) dto: DeleteAgentDto): Promise<DefaultResponse<{ ok: boolean }>> {
        const result = await this.agentService.delete(dto);
        return { data: result };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getAgent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getAgentById(@Body(new ValidationPipe()) dto: GetAgentDto): Promise<DefaultResponse<IAgent>> {
        const agent = await this.agentService.findById(dto.agentId);
        return { data: agent };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listAgents')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listAgents(
        @Body(new ValidationPipe()) dto: ListAgentsFilterDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IAgent[]>> {
        const filterData = {
            ...dto,
            workspaceId,
        };
        const agents = await this.agentService.list(filterData);
        return { data: agents };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listPredefinedPersonalities')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listPredefinedPersonalities(): Promise<DefaultResponse<any[]>> {
        const result = await this.agentService.listPredefinedPersonalities();

        return {
            data: result,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('canAgentRespondWelcome')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async canAgentRespondWelcome(@Param('workspaceId') workspaceId: string): Promise<DefaultResponse<boolean>> {
        const canRespond = await this.agentService.canAgentRespondWelcome(workspaceId);
        return { data: canRespond };
    }
}
