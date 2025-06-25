import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { UserDecorator } from "./../../../../decorators/user.decorator";
import { CreateTemplateGroupDto } from "../dto/create-template-group.dto";
import { UpdateTemplateGroupDto } from "../dto/update-template-group.dto";
import { TemplateGroupService } from "../services/template-group.service";
import { User } from "../../../../modules/users/interfaces/user.interface";
import { RolesDecorator } from "./../../../users/decorators/roles.decorator";
import { PredefinedRoles } from "./../../../../common/utils/utils";
import { RolesGuard } from "./../../../users/guards/roles.guard";
import { AuthGuard } from "../../../auth/guard/auth.guard";

@Controller('dashboard-template')
@UseGuards(AuthGuard)
export class TemplateGroupController {

    constructor(
        private readonly templateGroupService: TemplateGroupService,
    ) {}

    @Post('workspaces/:workspaceId/template-groups')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async create(
        @Param('workspaceId') workspaceId: string,
        @Body() body: CreateTemplateGroupDto
    ) {
        return await this.templateGroupService.create({
            ...body,
            workspaceId,
        }) 
    }

    @Put('workspaces/:workspaceId/template-groups/:id')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async update(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
        @Body() body: UpdateTemplateGroupDto,
        @UserDecorator() user: User,
    ) {
        return await this.templateGroupService.update({
            ...body,
            id,
        }, user) 
    }

    @Get('workspaces/:workspaceId/template-groups')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async listByWorkspace(
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.templateGroupService.listByWorkspace(workspaceId, user);
    }

    @Delete('workspaces/:workspaceId/template-groups/:id')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async deleteTemplateGroupById(
        @Param('id') id: string,
    ){
        return await this.templateGroupService.deleteTemplateGroupById(id);
    }
}