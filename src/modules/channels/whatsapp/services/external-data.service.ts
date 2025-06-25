import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ChannelConfigService } from '../../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    private channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
    }

    async getChannelConfigByToken(token: string) {
        try {
            return await this.channelConfigService.getOneBtIdOrToken(token);
        } catch (e) {
            return null;
        }
    }
}
