import { PredefinedRoles } from '../../../common/utils/utils';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Get, Param, ValidationPipe } from '@nestjs/common';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { ContactAutoAssignService } from '../services/contact-auto-assign.service';

@Controller('workspaces')
@ApiTags('Contact auto assign')
export class ContactAutoAssignController {
    constructor(private readonly ContactAutoAssignService: ContactAutoAssignService) {}

    @Get(':workspaceId/contact-auto-assigns/:contactAutoAssignId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getOneAutoAssignConversation(
        @Param('contactAutoAssignId') contactAutoAssignId: number,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.ContactAutoAssignService.getOne(contactAutoAssignId, workspaceId);
    }

    @Post(':workspaceId/contact-auto-assigns/phone')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getOneContactAutoAssignByPhone(
        @Body(new ValidationPipe()) body: { phone: string },
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.ContactAutoAssignService.getContactAutoAssignByPhone(workspaceId, body.phone);
    }

    @Post(':workspaceId/contact-auto-assign/add-contact')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async addContactAutoAssignConversation(
        @Body(new ValidationPipe()) body: { phone: string; autoAssignId: number },
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.ContactAutoAssignService.addAutoAssignIdByContactAutoAssign(
            workspaceId,
            body.phone,
            body.autoAssignId,
        );
    }
}
