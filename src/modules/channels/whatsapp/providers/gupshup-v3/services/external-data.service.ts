import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FileUploaderService } from '../../../../../../common/file-uploader/file-uploader.service';
import { FlowService } from '../../../../../whatsapp-flow/services/flow.service';
import { GupshupIdHashService } from '../../../../gupshup/services/gupshup-id-hash.service';
import { ActivityService } from '../../../../../activity/services/activity.service';
import { ActiveMessageService } from '../../../../../active-message/services/active-message.service';
import { MismatchWaidService } from '../../../../../channels/gupshup/services/mismatch-waid.service';
import {
    CreateConversationService,
    ICreateConversation,
} from '../../../../../conversation/services/create-conversation.service';
import { ConversationService } from '../../../../../conversation/services/conversation.service';
import { ChannelConfigService } from '../../../../../channel-config/channel-config.service';
import {
    IConversationWhatsappExpirationUpdated,
    TemplateCategory,
    TemplateRejectionReason,
    TemplateStatus,
} from 'kissbot-core';
import { Conversation } from './../../../../../conversation/interfaces/conversation.interface';
import { FlowDataService } from '../../../../../whatsapp-flow/services/flow-data.service';
import { AttachmentService } from '../../../../../attachment/services/attachment.service';
import { WhatsappIdHashService } from '../../../services/whatsapp-id-hash.service';
import { TemplateMessageService } from '../../../../../template-message/services/template-message.service';

@Injectable()
export class ExternalDataService implements OnApplicationBootstrap {
    private fileUploaderService: FileUploaderService;
    private flowService: FlowService;
    private flowDataService: FlowDataService;
    private gupshupIdHashService: GupshupIdHashService;
    private activityService: ActivityService;
    private activeMessageService: ActiveMessageService;
    private mismatchWaidService: MismatchWaidService;
    private createConversationService: CreateConversationService;
    private conversationService: ConversationService;
    private channelConfigService: ChannelConfigService;
    private attachmentService: AttachmentService;
    private whatsappIdHashService: WhatsappIdHashService;
    private templateMessageService: TemplateMessageService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        try {
            this.fileUploaderService = this.moduleRef.get<FileUploaderService>(FileUploaderService, { strict: false });
            this.flowService = this.moduleRef.get<FlowService>(FlowService, { strict: false });
            this.flowDataService = this.moduleRef.get<FlowDataService>(FlowDataService, { strict: false });
            this.gupshupIdHashService = this.moduleRef.get<GupshupIdHashService>(GupshupIdHashService, {
                strict: false,
            });
            this.activityService = this.moduleRef.get<ActivityService>(ActivityService, { strict: false });
            this.activeMessageService = this.moduleRef.get<ActiveMessageService>(ActiveMessageService, {
                strict: false,
            });
            this.mismatchWaidService = this.moduleRef.get<MismatchWaidService>(MismatchWaidService, { strict: false });
            this.createConversationService = this.moduleRef.get<CreateConversationService>(CreateConversationService, {
                strict: false,
            });
            this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, {
                strict: false,
            });
            this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, {
                strict: false,
            });
            this.attachmentService = this.moduleRef.get<AttachmentService>(AttachmentService, { strict: false });
            this.whatsappIdHashService = this.moduleRef.get<WhatsappIdHashService>(WhatsappIdHashService, {
                strict: false,
            });
            this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
                strict: false,
            });

            console.log('ExternalDataService initialized successfully');
        } catch (error) {
            console.error('Error initializing ExternalDataService:', error);
        }
    }

    async getAuthUrl(fileKey: string, options?: any) {
        try {
            return await this.fileUploaderService.getAuthUrl(fileKey, options);
        } catch (e) {
            return null;
        }
    }

    async getFlowById(flowId: number) {
        try {
            return await this.flowService.getFlowById(flowId);
        } catch (e) {
            return null;
        }
    }

    async getFlowDataWithFlow(flowDataId: number) {
        try {
            const result = await this.flowDataService.getFlowDataByIdAndFlow(flowDataId);
            return result.data;
        } catch (e) {
            return null;
        }
    }

    async findHashByGsId(gsId: string) {
        try {
            return await this.gupshupIdHashService.findHashByGsId(gsId);
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

    async getMismatchWaidAndPhoneNumber(waidOrPhoneNumber: string) {
        try {
            return await this.mismatchWaidService.getMismatchWaidAndPhoneNumber(waidOrPhoneNumber);
        } catch (e) {
            return null;
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

    async getConversationIdByActivityHash(hash) {
        return await this.activityService.getConversationIdByActivityHash(hash);
    }

    async findHashByWppId(wppId) {
        return await this.whatsappIdHashService.findHashByWppId(wppId);
    }

    async findByHash(hash) {
        return await this.whatsappIdHashService.findByHash(hash);
    }

    async getOneConversation(conversationId) {
        return await this.conversationService.getOne(conversationId);
    }

    async updateDeliveredMessageInConversation(conversationId) {
        return await this.conversationService.updateDeliveredMessageInConversation(conversationId);
    }

    async updateConversationInvalidNumber(conversationId, workspaceId) {
        return await this.conversationService.updateConversationInvalidNumber(conversationId, workspaceId);
    }

    async checkMissingRead(phoneNumber, channelConfigToken) {
        return await this.activeMessageService.checkMissingRead(phoneNumber, channelConfigToken);
    }

    async updateTemplateApprovalStatusAndWhatsappId(
        channelConfigToken: string,
        templateId: string,
        whatsappTemplateId: string,
        status: TemplateStatus,
        rejectedReason?: TemplateRejectionReason,
        category?: TemplateCategory,
    ) {
        try {
            console.log('Updating template approval status:', { templateId, whatsappTemplateId, status });
            if (!this.templateMessageService) {
                console.error('TemplateMessageService not initialized');
                return;
            }
            if (!this.templateMessageService.updateTemplateApprovalStatusAndWhatsappId) {
                console.error('updateTemplateApprovalStatusAndWhatsappId method not found on TemplateMessageService');
                return;
            }
            await this.templateMessageService.updateTemplateApprovalStatusAndWhatsappId(
                channelConfigToken,
                templateId,
                whatsappTemplateId,
                status,
                rejectedReason,
                category,
            );
            console.log('Template approval status updated successfully');
        } catch (e) {
            console.error('Error updating template approval status:', e);
        }
    }

    async updateTemplateCategory(channelConfigToken: string, templateId: string, category: TemplateCategory) {
        try {
            console.log('Updating template category:', { templateId, category });
            if (!this.templateMessageService) {
                console.error('TemplateMessageService not initialized');
                return;
            }
            if (!this.templateMessageService.updateCategoryTemplate) {
                console.error('updateCategoryTemplate method not found on TemplateMessageService');
                return;
            }
            const channelConfig = await this.channelConfigService.getOneByToken(channelConfigToken);
            const result = await this.templateMessageService.updateCategoryTemplate(
                channelConfig,
                templateId,
                category,
            );
            console.log('Template category updated successfully');
            return result;
        } catch (e) {
            console.error('Error updating template category:', e);
        }
    }
}
