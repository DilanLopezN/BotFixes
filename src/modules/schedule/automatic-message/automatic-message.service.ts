import { Injectable } from '@nestjs/common';
import { ActiveMessageService } from '../../active-message/services/active-message.service';
import { ConversationService } from '../../conversation/services/conversation.service';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { EmailSendingSettingService } from '../../email-sender/services/email-sending-setting.service';
import { ModuleRef } from '@nestjs/core';
import { Conversation } from '../../conversation/interfaces/conversation.interface';

@Injectable()
export class AutomaticMessageService {
    private activeMessageService: ActiveMessageService;
    private conversationService: ConversationService;
    private templateMessageService: TemplateMessageService;
    private emailSendingSettingService: EmailSendingSettingService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.activeMessageService = this.moduleRef.get<ActiveMessageService>(ActiveMessageService, {
            strict: false,
        });
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, {
            strict: false,
        });
        this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
            strict: false,
        });
        this.emailSendingSettingService = this.moduleRef.get<EmailSendingSettingService>(EmailSendingSettingService, {
            strict: false,
        });
    }

    async getConversationIdByScheduleMessageUuidList(
        uuidList: string[],
        workspaceId: string,
    ): Promise<{ [key: string]: string }> {
        const partialActMsgList = await this.activeMessageService.getConversationIdByExternalIdList(
            uuidList,
            workspaceId,
        );
        const result = {};
        for (const partialActMsg of partialActMsgList) {
            result[partialActMsg.externalId] = partialActMsg.conversationId;
        }
        return result;
    }

    async getConversationById(conversationId: string): Promise<Conversation> {
        return await this.conversationService.getConversationById(conversationId);
    }

    async dispatchMessageActivity(conversation, activity) {
        return await this.conversationService.dispatchMessageActivity(conversation, activity);
    }

    async getTemplateById(templateId: string) {
        return await this.templateMessageService.getOne(templateId);
    }

    async getParsedTemplate(templateId: string, values: { key: string; value: string }[]) {
        return await this.templateMessageService.getParsedTemplate(templateId, values);
    }

    async getTemplateVariableKeys(templateId: string, values: { key: string; value: string }[]) {
        return await this.templateMessageService.getTemplateVariableKeys(templateId, values);
    }

    async getEmailSendingSettingByWorkspaceIdAndId(workspaceId: string, emailSendingSettingId: number) {
        return await this.emailSendingSettingService.getEmailSendingSettingByWorkspaceIdAndId(
            workspaceId,
            emailSendingSettingId,
        );
    }

    async getEmailTemplateVariableKeys(templateId: string, versionId: string) {
        return await this.emailSendingSettingService.getTemplateVariableKeys(templateId, versionId);
    }

    async getEmailTemplateByVersion(templateId: string, versionId: string) {
        return await this.emailSendingSettingService.validateTemplateSendGrid(templateId, versionId);
    }
}
