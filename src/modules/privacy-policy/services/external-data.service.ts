import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { FixedResponsesWelcome } from '../../interactions/interfaces/response.interface';
import { ChannelConfigService } from '../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    private interactionsService: InteractionsService;
    private channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
    }

    async updateInteractionWelcome(workspaceId: string) {
        return await this.interactionsService.updateWelcomeInteractionWithFixedResponse(
            workspaceId,
            FixedResponsesWelcome.PRIVACY_POLICY,
            {},
        );
    }

    async getChannelConfigByIdOrToken(channelConfigToken: string) {
        return await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
    }
}
