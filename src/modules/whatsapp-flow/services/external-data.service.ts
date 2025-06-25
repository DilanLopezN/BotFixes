import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { WhatsappBridgeService } from '../../channels/whatsapp/services/whatsapp-bridge.service';
import { ChannelConfigService } from '../../../modules/channel-config/channel-config.service';
@Injectable()
export class ExternalDataService {
    private templateMessageService: TemplateMessageService;
    private whatsappBridgeService: WhatsappBridgeService;
    private channelConfigService: ChannelConfigService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
            strict: false,
        });
        this.whatsappBridgeService = this.moduleRef.get<WhatsappBridgeService>(WhatsappBridgeService, {
            strict: false,
        });
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, {
            strict: false,
        });
    }

    async createTemplateMessage(data: any) {
        try {
            return await this.templateMessageService._create(data, true);
        } catch (error) {
            console.log('Error create template: ', JSON.stringify(error));
        }
    }

    async createFlow(channelConfigId: string, data: any) {
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigId);
        return await this.whatsappBridgeService.createFlow(channelConfig, data);
    }

    async updateFlowJSON(channelConfigId: string, flowId: string, flowJSON: string) {
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigId);
        return await this.whatsappBridgeService.updateFlowJSON(channelConfig, flowId, flowJSON);
    }

    async publishFlow(channelConfigId: string, flowId: string) {
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigId);
        return await this.whatsappBridgeService.publishFlow(channelConfig, flowId);
    }

    async getPreviewFlowURL(channelConfigId: string, flowId: string) {
        // try {
        //     const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigId);
        //     return await this.whatsappOutcomingConsumerService.getPreviewFlowURL(channelConfig, flowId);
        // } catch (error) {
        //     console.log('Error getPreviewFlowURL: ', JSON.stringify(error));
        //     return null;
        // }
        return {} as any;
    }

    async updateTemplateFlowInactivated(workspaceId: string, flowDataId: number) {
        try {
            return await this.templateMessageService.updateTemplateFlowInactivated(workspaceId, flowDataId);
        } catch (error) {
            console.log('Error updateTemplateFlowInactivated: ', JSON.stringify(error));
        }
    }
}
