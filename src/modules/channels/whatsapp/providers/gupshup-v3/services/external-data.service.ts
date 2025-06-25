import { Injectable } from '@nestjs/common';
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
import { IConversationWhatsappExpirationUpdated } from 'kissbot-core';
import { Conversation } from './../../../../../conversation/interfaces/conversation.interface';
import { FlowDataService } from '../../../../../whatsapp-flow/services/flow-data.service';

@Injectable()
export class ExternalDataService {
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
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.fileUploaderService = this.moduleRef.get<FileUploaderService>(FileUploaderService, { strict: false });
        this.flowService = this.moduleRef.get<FlowService>(FlowService, { strict: false });
        this.flowDataService = this.moduleRef.get<FlowDataService>(FlowDataService, { strict: false });
        this.gupshupIdHashService = this.moduleRef.get<GupshupIdHashService>(GupshupIdHashService, { strict: false });
        this.activityService = this.moduleRef.get<ActivityService>(ActivityService, { strict: false });
        this.activeMessageService = this.moduleRef.get<ActiveMessageService>(ActiveMessageService, { strict: false });
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
}
