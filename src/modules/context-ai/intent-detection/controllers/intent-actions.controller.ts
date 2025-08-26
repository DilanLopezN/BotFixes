import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { IntentActionsService } from '../services/intent-actions.service';
import {
    CreateIntentActionsDto,
    UpdateIntentActionsDto,
    DeleteIntentActionsDto,
    GetIntentActionsDto,
    ListIntentActionsByIntentDto,
} from '../dto/intent-actions.dto';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IIntentActions } from '../interfaces/intent-actions.interface';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@ApiTags('Intent Actions')
@Controller('workspaces/:workspaceId/conversation-ai/intent-actions')
export class IntentActionsController {
    constructor(private readonly intentActionsService: IntentActionsService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createIntentAction')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createIntentAction(
        @Body(new ValidationPipe()) dto: CreateIntentActionsDto,
    ): Promise<DefaultResponse<IIntentActions>> {
        const intentAction = await this.intentActionsService.create(dto);
        return { data: intentAction };
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateIntentAction')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateIntentAction(
        @Body(new ValidationPipe()) dto: UpdateIntentActionsDto,
    ): Promise<DefaultResponse<IIntentActions>> {
        const intentAction = await this.intentActionsService.update(dto);
        return { data: intentAction };
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteIntentAction')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteIntentAction(
        @Body(new ValidationPipe()) dto: DeleteIntentActionsDto,
    ): Promise<DefaultResponse<{ ok: boolean }>> {
        const result = await this.intentActionsService.delete(dto);
        return { data: result };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getIntentAction')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getIntentActionById(
        @Body(new ValidationPipe()) dto: GetIntentActionsDto,
    ): Promise<DefaultResponse<IIntentActions>> {
        const intentAction = await this.intentActionsService.findById(dto.intentActionsId);
        return { data: intentAction };
    }

    @HttpCode(HttpStatus.OK)
    @Post('listIntentActionsByIntent')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listIntentActionsByIntent(
        @Body(new ValidationPipe()) dto: ListIntentActionsByIntentDto,
    ): Promise<DefaultResponse<IIntentActions[]>> {
        const intentActions = await this.intentActionsService.findByIntentId(dto.intentId);
        return { data: intentActions };
    }
}
