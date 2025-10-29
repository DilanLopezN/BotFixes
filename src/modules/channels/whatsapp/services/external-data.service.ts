import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ChannelConfigService } from '../../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    private _channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get channelConfigService(): ChannelConfigService {
        if (!this._channelConfigService) {
            this._channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        }
        return this._channelConfigService;
    }

    async getChannelConfigByToken(token: string) {
        try {
            return await this.channelConfigService.getOneBtIdOrToken(token);
        } catch (e) {
            return null;
        }
    }
}
