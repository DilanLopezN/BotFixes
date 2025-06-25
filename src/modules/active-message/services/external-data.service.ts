import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConversationCloseType } from 'kissbot-core';
import { ChannelConfigService } from '../../channel-config/channel-config.service';
import { ContactService } from '../../contact/services/contact.service';
import { ConversationService } from '../../conversation/services/conversation.service';
import { WhatsappSessionControlService } from '../../whatsapp-session-control/services/whatsapp-session-control.service';
import { BotsService } from '../../bots/bots.service';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { TagsService } from '../../tags/tags.service';

@Injectable()
export class ExternalDataService {
    private channelConfigService: ChannelConfigService;
    private conversationContactService: ContactService;
    private conversationService: ConversationService;
    private whatsappSessionControlService: WhatsappSessionControlService;
    private botsService: BotsService;
    private templateMessageService: TemplateMessageService;
    private tagsService: TagsService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        this.conversationContactService = this.moduleRef.get<ContactService>(ContactService, { strict: false });
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        this.whatsappSessionControlService = this.moduleRef.get<WhatsappSessionControlService>(
            WhatsappSessionControlService,
            { strict: false },
        );
        this.botsService = this.moduleRef.get<BotsService>(BotsService, { strict: false });
        this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
            strict: false,
        });
        this.tagsService = this.moduleRef.get<TagsService>(TagsService, { strict: false });
    }
    async getCanValidateLoggedInWrapperChannelConfig() {
        const result = await this.channelConfigService.getCanValidateLoggedInWrapperChannelConfig();
        return result;
    }

    async getOneBtIdOrToken(channelConfigToken: string) {
        const result = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
        return result;
    }

    async findOneContact(data) {
        const result = await this.conversationContactService.findOne(data);
        return result;
    }

    async findOpenedConversationByMemberIdAndChannelId(parsedNumber: string, channelId: string, workspaceId: string) {
        const result = await this.conversationService.findOpenedConversationByMemberIdAndChannelId(
            parsedNumber,
            channelId,
            workspaceId,
        );
        return result;
    }

    async getConversationByMemberIdListAndChannelConfig(numberList: string[], token: string) {
        const result = await this.conversationService.getConversationByMemberIdListAndChannelConfig(numberList, token);
        return result;
    }

    getChannelConfigPrivateData(channelConfig) {
        const result = this.conversationService.getChannelConfigPrivateData(channelConfig);
        return result;
    }

    async createConversation(conversationToSave) {
        const result = await this.conversationService._create(conversationToSave);
        return result;
    }

    async addAttributesToConversation(conversationId: string, attributes) {
        await this.conversationService.addAttributesToConversation(conversationId, attributes);
    }

    async addMember(conversationId: string, systemMember, sendActivity: boolean) {
        await this.conversationService.addMember(conversationId, systemMember, sendActivity);
    }

    async dispatchMessageActivity(conversation, activity) {
        await this.conversationService.dispatchMessageActivity(conversation, activity);
    }

    async closeConversation(conversation, conversationId, systemMember, type: ConversationCloseType) {
        await this.conversationService.closeConversation(
            conversation.workspace._id,
            conversationId,
            systemMember.id,
            { message: undefined },
            type,
        );
    }

    async hasOpenedConversationByPhoneNumberAndWorkspaceId(phoneNumber, workspaceId) {
        const result = await this.conversationService.hasOpenedConversationByPhoneNumberAndWorkspaceId(
            phoneNumber,
            workspaceId,
        );
        return result;
    }

    async findSessionByWorkspaceAndNumberAndChannelConfigId(workspaceId, parsedNumber, channelConfig) {
        const result = await this.whatsappSessionControlService.findSessionByWorkspaceAndNumberAndChannelConfigId(
            workspaceId,
            parsedNumber,
            channelConfig.token,
        );
        return result;
    }

    async getOneBot(botId) {
        const result = await this.botsService.getOne(botId);
        return result;
    }

    async getParsedTemplate(templateId: string, values) {
        const result = await this.templateMessageService.getParsedTemplate(templateId, values);
        return result;
    }

    async getTemplateVariableValues(templateId: string, values) {
        const result = await this.templateMessageService.getTemplateVariableValues(templateId, values);
        return result;
    }

    async getWorkspaceTags(workspaceId) {
        const result = await this.tagsService.getWorkspaceTags(workspaceId);
        return result;
    }
}
