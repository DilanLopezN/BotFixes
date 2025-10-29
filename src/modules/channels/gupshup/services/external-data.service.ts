import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Activity } from '../../../activity/interfaces/activity';
import { ChannelConfigService, CompleteChannelConfig } from '../../../channel-config/channel-config.service';
import { ActivityV2AckService } from '../../../activity-v2/services/activity-v2-ack.service';
import { WhatsappBridgeService } from '../../whatsapp/services/whatsapp-bridge.service';

@Injectable()
export class ExternalDataService {
    private _whatsappBridgeService: WhatsappBridgeService;
    private _channelConfigService: ChannelConfigService;
    private _activityV2AckService: ActivityV2AckService;
    constructor(private readonly moduleRef: ModuleRef) {}

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
            this._channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        }
        return this._channelConfigService;
    }

    private get activityV2AckService(): ActivityV2AckService {
        if (!this._activityV2AckService) {
            this._activityV2AckService = this.moduleRef.get<ActivityV2AckService>(ActivityV2AckService, { strict: false });
        }
        return this._activityV2AckService;
    }

    async sendFlowMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        try {
            const response = await this.whatsappBridgeService.sendFlowMessage(channelConfig, {
                activity,
            });

            return { messageId: response.msg_id };
        } catch (e) {
            console.error('ERROR - sendFlowMessage: ', e);
            return null;
        }
    }

    async getChannelConfig(token: string) {
        try {
            return await this.channelConfigService.getOneBtIdOrToken(token);
        } catch (e) {
            console.error('ERROR - getChannelConfig: ', e);
            return null;
        }
    }

    async findAckByHash(hash: string) {
        return await this.activityV2AckService.findAckByHash(hash);
    }
}
