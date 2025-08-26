import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserDecorator } from '../../decorators/user.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { User } from '../users/interfaces/user.interface';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { geIp, PredefinedRoles } from './../../common/utils/utils';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { UpdateWorkspaceAdvancedModuleFeaturesDto, UpdateWorkspaceFlagsDto, WorkspaceDto } from './dtos/workspace.dto';
import { SyncWorkspacesDialogflowService } from './services/sync-workspace-dialogflow.service';
import { WorkspacesService } from './services/workspaces.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
    constructor(
        private readonly workspaceService: WorkspacesService,
        private readonly syncWorkspacesDialogflowService: SyncWorkspacesDialogflowService,
    ) {}

    @Post()
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    save(@Body(new ValidationPipe({ transform: true })) workspaceDto: WorkspaceDto) {
        return this.workspaceService._create(workspaceDto);
    }

    @Put(':workspaceId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    update(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) workspaceDto: WorkspaceDto,
        @UserDecorator() user: User,
    ) {
        return this.workspaceService._update(workspaceId, workspaceDto, user);
    }

    @Put(':workspaceId/updateAdvancedModuleFeatures')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    updateAdvancedModuleFeatures(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true })) body: UpdateWorkspaceAdvancedModuleFeaturesDto,
        @UserDecorator() user: User,
    ) {
        return this.workspaceService.updateAdvancedModuleFeatures(workspaceId, body, user);
    }

    @Get(':workspaceId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    getOne(@Param('workspaceId') workspaceId: string) {
        return this.workspaceService._getOne(workspaceId);
    }

    @Post(':workspaceId/customization')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'ID do Workspace', type: String, required: true })
    updateFlagsAndConfigs(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ transform: true, whitelist: true })) body: UpdateWorkspaceFlagsDto,
        @UserDecorator() user: User,
    ) {
        return this.workspaceService.updateFlagsAndConfigs(workspaceId, body, user);
    }

    @Get(':workspaceId/check-blocked')
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.WORKSPACE_AGENT])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    checkWorkspaceBlocked(@Param('workspaceId') workspaceId: string) {
        return this.workspaceService.isWorkspaceDisabled(workspaceId);
    }

    @Get()
    @UseGuards(AuthGuard)
    @ApiQuery({ name: 'page', description: 'page number', type: Number, required: false })
    @ApiQuery({ name: 'limit', description: 'limit per page', type: Number, required: false })
    getAll(
        @QueryStringDecorator({
            filters: [],
        })
        query: QueryStringFilter,
        @UserDecorator() user: User,
        @Req() req: Request,
    ) {
        const clientIp = geIp(req);
        try {
            if (
                user._id?.toString?.() == '634f342a98afa42b6eb00f0a' ||
                user._id?.toString?.() == '6231f3dfbb88310008118c91'
            ) {
                console.log('getAll', req.socket.remoteAddress);
                console.log('getAll2', req.headers['x-forwarded-for']);
                console.log('getAll3', clientIp);
            }
        } catch (e) {
            console.log('parseUser', e);
        }

        return this.workspaceService._getAll(user, query, clientIp);
    }

    @Get(':workspaceId/sync/:type')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    @ApiParam({ name: 'type', description: 'type', type: String, required: false })
    sync(@Param('workspaceId') workspaceId: string, @Param('type') type: string) {
        return this.syncWorkspacesDialogflowService.sync(workspaceId, type);
    }

    @Put(':workspaceId/update-name')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    updateName(@Param('workspaceId') workspaceId: string, @Body() body: { name: string }) {
        return this.workspaceService.updateWorspaceName(workspaceId, body.name);
    }

    @Put(':workspaceId/update-customer')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    updateCustomerSettings(@Param('workspaceId') workspaceId: string, @Body() body: { email: string; id: string }) {
        return this.workspaceService.updateWorspaceCustomerXSettings(workspaceId, {
            customerXEmail: body.email,
            customerXId: body.id,
        });
    }
}
