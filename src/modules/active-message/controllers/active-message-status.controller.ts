import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { CreateActiveMessageStatusDto } from '../dto/create-active-message-status.dto';
import { UpdateActiveMessageStatusDto } from '../dto/update-active-message-status.dto';
import { ActiveMessageStatusService } from '../services/active-message-status.service';
import { RolesGuard } from '../../users/guards/roles.guard';

@Controller('workspaces')
export class ActiveMessageStatusController {
    constructor(private readonly activeMessageStatusService: ActiveMessageStatusService) {}

    @Get('/:workspaceId/active-message-status')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listByWorkspaceId(@Param('workspaceId') workspaceId: string) {
        return this.activeMessageStatusService.listStatusByWorkspaceId(workspaceId);
    }

    @Post('/:workspaceId/active-message-status')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async createStatus(@Param('workspaceId') workspaceId: string, @Body() body: CreateActiveMessageStatusDto) {
        return this.activeMessageStatusService.createStatus({
            ...body,
            workspaceId,
        });
    }

    @Put('/:workspaceId/active-message-status/:statusId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async updateStatus(
        @Param('workspaceId') workspaceId: string,
        @Param('statusId') statusId: number,
        @Body() body: UpdateActiveMessageStatusDto,
    ) {
        return this.activeMessageStatusService.updateStatus({
            ...body,
            id: statusId,
        });
    }

    @Delete('/:workspaceId/active-message-status/:statusId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async deleteStatus(@Param('workspaceId') workspaceId: string, @Param('statusId') statusId: number) {
        return this.activeMessageStatusService.deleteStatus({
            workspaceId,
            id: statusId,
        });
    }
}
