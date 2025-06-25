import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FileUploaderService } from '../../../../../../common/file-uploader/file-uploader.service';
// import { FlowService } from '../../../services/flow/flow.service';
import { ActivityService } from '../../../../../activity/services/activity.service';
import { ActiveMessageService } from '../../../../../active-message/services/active-message.service';
import {
    CreateConversationService,
    ICreateConversation,
} from '../../../../../conversation/services/create-conversation.service';
import { ConversationService } from '../../../../../conversation/services/conversation.service';
import { ChannelConfigService } from '../../../../../channel-config/channel-config.service';
import { IConversationWhatsappExpirationUpdated } from 'kissbot-core';
import { Conversation } from './../../../../../conversation/interfaces/conversation.interface';
// import { FlowDataService } from '../../../services/flow/flow-data.service';
import { WhatsappIdHashService } from '../../../services/whatsapp-id-hash.service';
import { AttachmentService } from '../../../../../attachment/services/attachment.service';
import { TemplateMessageService } from '../../../../../../modules/template-message/services/template-message.service';
import { TemplateStatus } from '../../../../../../modules/template-message/schema/template-message.schema';
import { TemplateRejectionReason } from '../../../../../../modules/template-message/schema/template-message.schema';
import { TemplateCategory } from '../../../../../../modules/channels/gupshup/services/partner-api.service';

@Injectable()
export class ExternalDataService {
    private fileUploaderService: FileUploaderService;
    private whatsappIdHashService: WhatsappIdHashService;
    private attachmentService: AttachmentService;
    private activityService: ActivityService;
    private activeMessageService: ActiveMessageService;
    private createConversationService: CreateConversationService;
    private conversationService: ConversationService;
    private channelConfigService: ChannelConfigService;
    private templateMessageService: TemplateMessageService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.attachmentService = this.moduleRef.get<AttachmentService>(AttachmentService, { strict: false });
        this.fileUploaderService = this.moduleRef.get<FileUploaderService>(FileUploaderService, { strict: false });
        this.whatsappIdHashService = this.moduleRef.get<WhatsappIdHashService>(WhatsappIdHashService, {
            strict: false,
        });
        this.activityService = this.moduleRef.get<ActivityService>(ActivityService, { strict: false });
        this.activeMessageService = this.moduleRef.get<ActiveMessageService>(ActiveMessageService, { strict: false });
        this.createConversationService = this.moduleRef.get<CreateConversationService>(CreateConversationService, {
            strict: false,
        });
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, {
            strict: false,
        });
        this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
            strict: false,
        });
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, {
            strict: false,
        });
    }

    async getAuthUrl(fileKey: string, options?: any) {
        try {
            return await this.fileUploaderService.getAuthUrl(fileKey, options);
        } catch (e) {
            return null;
        }
    }

    async findHashByGsId(gsId: string) {
        try {
            return await this.whatsappIdHashService.findHashByWppId(gsId);
        } catch (e) {
            return null;
        }
    }

    async existsActivityByHash(hash: string) {
        try {
            return await this.activityService.existsActivityByHash(hash);
        } catch (e) {
            return false;
        }
    }

    async handleActivity(
        activityRequest: any,
        conversationId: string,
        conversation?: Conversation,
        useActivityHash?: boolean,
    ) {
        try {
            return await this.activityService.handleActivity(
                activityRequest,
                conversationId,
                conversation,
                useActivityHash,
            );
        } catch (e) {
            return null;
        }
    }

    async checkMissingResponse(phoneNumber: string, channelConfigId: string) {
        try {
            return await this.activeMessageService.checkMissingResponse(phoneNumber, channelConfigId);
        } catch (e) {
            return;
        }
    }

    async getExistingConversation(channelConfigToken: string, memberId: string) {
        try {
            return await this.createConversationService.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            return null;
        }
    }

    async getConversation(createConversation: ICreateConversation) {
        try {
            return await this.createConversationService.getConversation(createConversation);
        } catch (e) {
            return null;
        }
    }

    async getOneConversation(conversationId) {
        return await this.conversationService.getOne(conversationId);
    }

    async updateDeliveredMessageInConversation(conversationId) {
        return await this.conversationService.updateDeliveredMessageInConversation(conversationId);
    }

    async createAndUpload(
        fileToUpload,
        conversationId,
        memberId,
        isStartActivity,
        messageText?,
        tempalteId?,
        user?,
        hash?,
    ) {
        return await this.attachmentService.createAndUpload(
            fileToUpload,
            conversationId,
            memberId,
            isStartActivity,
            messageText,
            tempalteId,
            user,
            hash,
        );
    }

    async checkMissingReceived(phoneNumber, channelConfigToken, error?) {
        return await this.activeMessageService.checkMissingReceived(phoneNumber, channelConfigToken, error);
    }

    async checkMissingRead(phoneNumber, channelConfigToken) {
        return await this.activeMessageService.checkMissingRead(phoneNumber, channelConfigToken);
    }

    async getConversationByMemberIdListAndChannelConfig(memberIdList: string[], channelConfigToken: string) {
        try {
            return await this.conversationService.getConversationByMemberIdListAndChannelConfig(
                memberIdList,
                channelConfigToken,
            );
        } catch (e) {
            return null;
        }
    }

    async updateWhatsappExpiration(ev: IConversationWhatsappExpirationUpdated) {
        try {
            return await this.conversationService.updateWhatsappExpiration(ev);
        } catch (e) {
            return;
        }
    }

    async updateConversationSessionCount(phoneNumber: string, conversationId: string, channelConfigToken: string) {
        try {
            return await this.conversationService.updateConversationSessionCount(
                phoneNumber,
                conversationId,
                channelConfigToken,
            );
        } catch (e) {
            return;
        }
    }

    async getOneBtIdOrToken(idOrToken: string) {
        try {
            return await this.channelConfigService.getOneBtIdOrToken(idOrToken);
        } catch (e) {
            return null;
        }
    }

    async updateConversationInvalidNumber(conversationId, workspaceId) {
        return await this.conversationService.updateConversationInvalidNumber(conversationId, workspaceId);
    }

    async getConversationIdByActivityHash(hash) {
        return await this.activityService.getConversationIdByActivityHash(hash);
    }

    async findHashByWppId(wppId) {
        return await this.whatsappIdHashService.findHashByWppId(wppId);
    }

    async findByHash(hash) {
        return await this.whatsappIdHashService.findByHash(hash);
    }

    async updateTemplateApprovalStatusAndWhatsappId(
        channelConfigToken: string,
        templateId: string,
        whatsappTemplateId: string,
        status: TemplateStatus,
        rejectedReason?: TemplateRejectionReason,
        category?: TemplateCategory,
    ) {
        await this.templateMessageService.updateTemplateApprovalStatusAndWhatsappId(
            channelConfigToken,
            templateId,
            whatsappTemplateId,
            status,
            rejectedReason,
            category,
        );
    }

    async updateTemplateCategory(channelConfigToken: string, templateId: string, category: TemplateCategory) {
        const channelConfig = await this.channelConfigService.getOneByToken(channelConfigToken);
        return await this.templateMessageService.updateCategoryTemplate(channelConfig, templateId, category);
    }

    async getTemplateName(templateId: string) {
        const template = await this.templateMessageService.getTemplateById(templateId);
        return template;
    }
}
