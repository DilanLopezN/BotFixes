import { PredefinedRoles } from '../../../common/utils/utils';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Get, Param, Delete, Put, ValidationPipe } from '@nestjs/common';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { PrivacyPolicyService } from '../services/privacy-policy.service';
import { CreatePrivacyPolicyDto, UpdatePrivacyPolicyDto } from '../dto/privacy-policy.dto';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User } from '../../users/interfaces/user.interface';
import * as moment from 'moment';

@Controller('workspaces')
@ApiTags('privacy-policy')
export class PrivacyPolicyController {
    constructor(private readonly privacyPolicyService: PrivacyPolicyService) {}

    @Post(':workspaceId/privacy-policy')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createPrivacyPolicy(
        @Body(new ValidationPipe()) body: CreatePrivacyPolicyDto,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.privacyPolicyService.create({
            ...body,
            createdAt: moment().toDate(),
            createdBy: String(user._id),
            workspaceId,
        });
    }

    @Put(':workspaceId/privacy-policy/:privacyPolicyId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async update(
        @Body(new ValidationPipe()) body: UpdatePrivacyPolicyDto,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('privacyPolicyId') privacyPolicyId: number,
    ) {
        return await this.privacyPolicyService.update(privacyPolicyId, workspaceId, String(user._id), {
            ...body,
        });
    }

    @Get(':workspaceId/privacy-policy/:privacyPolicyId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getOne(@Param('privacyPolicyId') privacyPolicyId: number, @Param('workspaceId') workspaceId: string) {
        return await this.privacyPolicyService.getOne(privacyPolicyId, workspaceId);
    }

    @Get(':workspaceId/privacy-policy-list')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard)
    getAllByWorkspaceId(@Param('workspaceId') workspaceId: string) {
        return this.privacyPolicyService.listByWorkspaceId(workspaceId);
    }

    @Delete(':workspaceId/privacy-policy/:privacyPolicyId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async delete(@Param('workspaceId') workspaceId: string, @Param('privacyPolicyId') privacyPolicyId: number) {
        return await this.privacyPolicyService.softDeletePrivacyPolicy(privacyPolicyId, workspaceId);
    }

    @Post(':workspaceId/privacy-policy/:privacyPolicyId/restart-acceptance')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async restartPrivacyPolicyAcceptance(
        @Param('workspaceId') workspaceId: string,
        @Param('privacyPolicyId') privacyPolicyId: number,
    ) {
        return await this.privacyPolicyService.restartPrivacyPolicyAcceptance(Number(privacyPolicyId), workspaceId);
    }
}
