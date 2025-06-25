import { Body, Controller, Post } from '@nestjs/common';
import { AutomaticMessageService } from './automatic-message.service';
import { Conversation } from '../../conversation/interfaces/conversation.interface';
import {
    GetConversationIdByScheduleMessageUuidListRequest,
    GetConversationByIdRequest,
    DispatchMessageActivityRequest,
    GetTemplateByIdRequest,
    GetParsedTemplateRequest,
    GetTemplateVariableKeysRequest,
    GetEmailSendingSettingByWorkspaceIdAndIdRequest,
    GetEmailTemplateVariableKeysRequest,
    GetEmailTemplateByVersionRequest,
} from '../interfaces/automatic-message.interface';

// Começa com internal pra seguir o mesmo padrão do engine.
// Esse controller vai servir para projetos internos e não vai ser exposto para o mundo
@Controller('internal/automatic-message')
export class AutomaticMessageController {
    constructor(private readonly automaticMessageService: AutomaticMessageService) {}

    @Post('getConversationIdByScheduleMessageUuidList')
    async getConversationIdByScheduleMessageUuidList(
        @Body() body: GetConversationIdByScheduleMessageUuidListRequest,
    ): Promise<any> {
        return await this.automaticMessageService.getConversationIdByScheduleMessageUuidList(
            body.uuidList,
            body.workspaceId,
        );
    }

    @Post('getConversationById')
    async getConversationById(@Body() body: GetConversationByIdRequest): Promise<Conversation> {
        return await this.automaticMessageService.getConversationById(body.conversationId);
    }

    @Post('dispatchMessageActivity')
    async dispatchMessageActivity(@Body() body: DispatchMessageActivityRequest): Promise<any> {
        return await this.automaticMessageService.dispatchMessageActivity(body.conversation, body.activity);
    }

    @Post('getTemplateById')
    async getTemplateById(@Body() body: GetTemplateByIdRequest): Promise<any> {
        return await this.automaticMessageService.getTemplateById(body.templateId);
    }

    @Post('getParsedTemplate')
    async getParsedTemplate(@Body() body: GetParsedTemplateRequest): Promise<any> {
        return await this.automaticMessageService.getParsedTemplate(body.templateId, body.values);
    }

    @Post('getTemplateVariableKeys')
    async getTemplateVariableKeys(@Body() body: GetTemplateVariableKeysRequest): Promise<any> {
        return await this.automaticMessageService.getTemplateVariableKeys(body.templateId, body.values);
    }

    @Post('getEmailSendingSettingByWorkspaceIdAndId')
    async getEmailSendingSettingByWorkspaceIdAndId(
        @Body() body: GetEmailSendingSettingByWorkspaceIdAndIdRequest,
    ): Promise<any> {
        return await this.automaticMessageService.getEmailSendingSettingByWorkspaceIdAndId(
            body.workspaceId,
            body.emailSendingSettingId,
        );
    }

    @Post('getEmailTemplateVariableKeys')
    async getEmailTemplateVariableKeys(@Body() body: GetEmailTemplateVariableKeysRequest): Promise<any> {
        return await this.automaticMessageService.getEmailTemplateVariableKeys(body.templateId, body.versionId);
    }

    @Post('getEmailTemplateByVersion')
    async getEmailTemplateByVersion(@Body() body: GetEmailTemplateByVersionRequest): Promise<any> {
        return await this.automaticMessageService.getEmailTemplateByVersion(body.templateId, body.versionId);
    }
}
