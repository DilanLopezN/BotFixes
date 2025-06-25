import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WhatsappOutcomingConsumerService } from '../../whatsapp/services/whatsapp-outcoming-consumer.service';
import { Activity } from '../../../activity/interfaces/activity';
import { ChannelConfigService, CompleteChannelConfig } from '../../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    // private whatsappConsumerService: WhatsappOutcomingConsumerService;
    private channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        // this.whatsappConsumerService = this.moduleRef.get<WhatsappOutcomingConsumerService>(
        //     WhatsappOutcomingConsumerService,
        //     {
        //         strict: false,
        //     },
        // );
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
    }

    async sendFlowMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        // TODO: Implementar pelo WhatsappBridge
        // try {
        //     const response = await this.whatsappConsumerService.sendFlowMessage(activity, channelConfig);
        //     return { messageId: response.msg_id };
        // } catch (e) {
        //     console.error('ERROR - sendFlowMessage: ', e);
        //     return null;
        // }
        return null;
    }

    async getChannelConfig(token: string) {
        try {
            return await this.channelConfigService.getOneBtIdOrToken(token);
        } catch (e) {
            console.error('ERROR - getChannelConfig: ', e);
            return null;
        }
    }
}
