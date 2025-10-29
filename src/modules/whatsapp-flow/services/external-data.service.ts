import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { WhatsappBridgeService } from '../../channels/whatsapp/services/whatsapp-bridge.service';
import { ChannelConfigService } from '../../../modules/channel-config/channel-config.service';
@Injectable()
export class ExternalDataService {
    private _templateMessageService: TemplateMessageService;
    private _whatsappBridgeService: WhatsappBridgeService;
    private _channelConfigService: ChannelConfigService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get templateMessageService(): TemplateMessageService {
        if (!this._templateMessageService) {
            this._templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
                strict: false,
            });
        }
        return this._templateMessageService;
    }

    private get whatsappBridgeService(): WhatsappBridgeService {
        if (!this._whatsappBridgeService) {
            this._whatsappBridgeService = this.moduleRef.get<WhatsappBridgeService>(WhatsappBridgeService, {
                strict: false,
            });
        }
        return this._whatsappBridgeService;
    }

    private get channelConfigService(): ChannelConfigService {
        if (!this._channelConfigService) {
            this._channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, {
                strict: false,
            });
        }
        return this._channelConfigService;
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
        try {
            const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigId);
            return await this.whatsappBridgeService.getPreviewFlowURL(channelConfig, flowId);
        } catch (error) {
            console.log('Error getPreviewFlowURL: ', JSON.stringify(error));
            return null;
        }
    }

    async updateProviderByActiveFlow(channelConfigId: string) {
        return await this.channelConfigService.updateProviderByActiveFlow(channelConfigId);
    }

    async updateTemplateFlowInactivated(workspaceId: string, flowDataId: number) {
        try {
            return await this.templateMessageService.updateTemplateFlowInactivated(workspaceId, flowDataId);
        } catch (error) {
            console.log('Error updateTemplateFlowInactivated: ', JSON.stringify(error));
        }
    }
}
