import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { FixedResponsesWelcome } from '../../interactions/interfaces/response.interface';
import { ChannelConfigService } from '../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    private _interactionsService: InteractionsService;
    private _channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get interactionsService(): InteractionsService {
        if (!this._interactionsService) {
            this._interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
        }
        return this._interactionsService;
    }

    private get channelConfigService(): ChannelConfigService {
        if (!this._channelConfigService) {
            this._channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        }
        return this._channelConfigService;
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
