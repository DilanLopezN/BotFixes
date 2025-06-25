import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PredefinedRoles } from '../../../common/utils/utils';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateEmailSendingSettingDto, UpdateEmailSendingSettingDto } from '../dto/email-sending-setting.dto';
import { EmailSendingSettingService } from '../services/email-sending-setting.service';
import { EmailSendingSetting } from '../models/email-sending-setting.entity';

@ApiTags('EmailSendingSetting')
@Controller('email-setting')
export class EmailSendingSettingController {
    constructor(private emailSendingSettingService: EmailSendingSettingService) {}

    @Post('workspaces/:workspaceId/create')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async create(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CreateEmailSendingSettingDto,
    ): Promise<EmailSendingSetting> {
        return await this.emailSendingSettingService.create(workspaceId, body);
    }

    @Put('workspaces/:workspaceId/id/:emailSettingId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async update(
        @Param('workspaceId') workspaceId: string,
        @Param('emailSettingId') emailSettingId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: UpdateEmailSendingSettingDto,
    ): Promise<EmailSendingSetting> {
        return await this.emailSendingSettingService.update(workspaceId, Number(emailSettingId), body);
    }

    @Delete('workspaces/:workspaceId/id/:emailSettingId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async softDelete(
        @Param('workspaceId') workspaceId: string,
        @Param('emailSettingId') emailSettingId: string,
    ): Promise<{ ok: boolean }> {
        return await this.emailSendingSettingService.softDelete(workspaceId, Number(emailSettingId));
    }

    @Get('/workspaces/:workspaceId/list')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getEmailSendingSettingsByWorkspaceId(
        @Param('workspaceId') workspaceId: string,
    ): Promise<EmailSendingSetting[]> {
        return await this.emailSendingSettingService.getEmailSendingSettingsByWorkspaceId(workspaceId);
    }

    @Get('workspaces/:workspaceId/id/:emailSettingId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getEmailSendingSettingByWorkspaceIdAndId(
        @Param('workspaceId') workspaceId: string,
        @Param('emailSettingId') emailSettingId: string,
    ): Promise<EmailSendingSetting> {
        return await this.emailSendingSettingService.getEmailSendingSettingByWorkspaceIdAndId(
            workspaceId,
            Number(emailSettingId),
        );
    }
}
