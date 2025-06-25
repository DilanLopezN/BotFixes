import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from './../../common/utils/utils';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { WorkspaceAccessGroupService } from './services/workspace-access-group.service';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CreateAccesGroupDto } from './dto/workspace-access-group.dto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';

@Controller('workspaces')
export class WorkspaceAccessGroupController {
    constructor(private readonly service: WorkspaceAccessGroupService) {}

    @Post(':workspaceId/access-groups')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    createAccesGroup(@Param('workspaceId') workspaceId: string, @Body() body: CreateAccesGroupDto) {
        return this.service.createGroup({
            ...body,
            accessSettings: {
                ipListData: body.accessSettings.ipListData,
                userList: body.accessSettings.userList.map((userId) => new Types.ObjectId(userId)),
            },
            workspaceId: new Types.ObjectId(workspaceId),
        });
    }

    @Put(':workspaceId/access-groups/:groupId')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    updateAccesGroup(
        @Param('workspaceId') workspaceId: string,
        @Param('groupId') groupId: string,
        @Body() body: CreateAccesGroupDto,
    ) {
        return this.service.updateGroupByWorkspaceIdAndId(
            new Types.ObjectId(groupId),
            new Types.ObjectId(workspaceId),
            {
                name: body.name,
                accessSettings: {
                    ipListData: body.accessSettings.ipListData,
                    userList: body.accessSettings.userList.map((userId) => new Types.ObjectId(userId)),
                },
            },
        );
    }

    @Get(':workspaceId/access-groups')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    getAccessGroupsByWorkspaceId(
        @Param('workspaceId') workspaceId: string,
        @QueryStringDecorator({
            filters: [],
        })
        query: any,
    ) {
        return this.service._queryPaginate(workspaceId, query);
    }

    @Get(':workspaceId/access-groups/:groupId')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getGroup(@Param('groupId') groupId: string, @Param('workspaceId') workspaceId: string) {
        return await this.service.findOne({
            workspaceId,
            _id: groupId,
        });
    }

    @ApiParam({ type: String, required: true, name: 'groupId' })
    @ApiResponse({ status: 200, isArray: false, description: '{ deleted: true }' })
    @Delete(':workspaceId/access-groups/:groupId')
    async deleteGroupAccess(@Param('groupId') groupId: string) {
        return await this.service.delete(groupId);
    }
}
