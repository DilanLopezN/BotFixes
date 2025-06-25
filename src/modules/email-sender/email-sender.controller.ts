import { Body, Controller, Get, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PredefinedRoles } from '../../common/utils/utils';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailSenderService } from './services/email-sender.service';
import { SendgridEmailStatusDto } from './dto/sendgrid-email-status.dto';

@ApiTags('EmailSender')
@Controller('email')
export class EmailSenderController {
    constructor(private emailSenderService: EmailSenderService) {}

    @Post('workspaces/:workspaceId/send')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async sendEmail(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: SendEmailDto,
    ): Promise<{ ok: boolean }> {
        return await this.emailSenderService.sendEmail(workspaceId, body);
    }

    @Post('sendgrid-webhook')
    async handleSendGridWebhook(@Body() body: Array<SendgridEmailStatusDto>): Promise<void> {
        await this.emailSenderService.processSendGridEvents(body);
    }

    @Get('templates')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getTemplates(): Promise<any[]> {
        return await this.emailSenderService.getTemplatesSendGrid();
    }

    @Get('templates/:templateId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getTemplateById(@Param('templateId') templateId: string): Promise<any> {
        return await this.emailSenderService.getTemplateSendGridById(templateId);
    }
}
