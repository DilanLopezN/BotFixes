import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { DefaultResponse } from '../../../common/interfaces/default';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { ContextVariableService } from './context-variable.service';
import { ContextVariable } from './entities/context-variables.entity';
import { CreateContextVariable } from './interfaces/create-context-variable.interface';
import { UpdateContextVariable } from './interfaces/update-context-variable.interface';
import { DeleteContextVariable } from './interfaces/delete-training-entry.interface';
import { ListContextVariablesDto } from './dto/list-context-variables.dto';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
    PredefinedRoles.WORKSPACE_ADMIN,
];

@Controller('workspaces/:workspaceId/conversation-ai/context-variable')
export class ContextVariableController {
    constructor(private readonly contextVariableService: ContextVariableService) {}

    @HttpCode(HttpStatus.OK)
    @Post('listContextVariables')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listContextVariables(
        @Body(new ValidationPipe()) dto: ListContextVariablesDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ContextVariable[]>> {
        const results = await this.contextVariableService.listVariablesFromAgent({
            ...dto,
            workspaceId,
        });

        return {
            data: results,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('createContextVariable')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createContextVariables(
        @Body(new ValidationPipe()) dto: CreateContextVariable,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ContextVariable>> {
        const result = await this.contextVariableService.createContextVariable(workspaceId, dto);

        return {
            data: result,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateContextVariable')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateContextVariable(
        @Body(new ValidationPipe()) dto: UpdateContextVariable,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ContextVariable>> {
        const result = await this.contextVariableService.updateContextVariable(workspaceId, dto);

        return {
            data: result,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteContextVariable')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteContextVariable(
        @Body(new ValidationPipe()) dto: DeleteContextVariable,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ ok: boolean }>> {
        const result = await this.contextVariableService.deleteContextVariable(workspaceId, dto);

        return {
            data: result,
        };
    }
}
