import { Injectable } from '@nestjs/common';
import { WhatsappInterfaceService } from '../interfaces/whatsapp-service.interface';
import { GupshupV3Service } from '../providers/gupshup-v3/services/gupshup-v3.service';
import { ModuleRef } from '@nestjs/core';
import { CustomBadRequestException, INTERNAL_ERROR_THROWER } from '../../../auth/exceptions';
import { CompleteChannelConfig } from '../../../channel-config/channel-config.service';
import { Dialog360Service } from '../providers/dialog360/services/dialog360.service';
import { ChannelConfigWhatsappProvider } from '../../../channel-config/schemas/channel-config.schema';

@Injectable()
export class WhatsappUtilService {
    constructor(private moduleRef: ModuleRef) {}

    async getService(channelConfig: CompleteChannelConfig): Promise<WhatsappInterfaceService> {
        const whatsProvider: ChannelConfigWhatsappProvider = channelConfig.whatsappProvider;

        switch (whatsProvider) {
            case ChannelConfigWhatsappProvider.gupshupv3:
                return this.moduleRef.get<GupshupV3Service>(GupshupV3Service, { strict: false });
            case ChannelConfigWhatsappProvider.d360:
                return this.moduleRef.get<Dialog360Service>(Dialog360Service, { strict: false });
            default:
                throw INTERNAL_ERROR_THROWER(
                    'Invalid channel',
                    new CustomBadRequestException('Invalid channelIdConfig in WhatsappService', 'INVALID_CHANNEL'),
                );
        }
    }
}
