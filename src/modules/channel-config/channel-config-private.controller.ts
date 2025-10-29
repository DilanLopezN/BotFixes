import { AuthGuard } from './../auth/guard/auth.guard';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ChannelConfigService } from './channel-config.service';
import { ChannelConfigDto } from './dto/channel-config.dto';

@ApiTags('Channel')
@Controller('/private/channel-configs')
export class ChannelConfigPrivateController {
    constructor(private readonly channelService: ChannelConfigService) {}

    @Post('getD360ChannelConfigByPhoneNumber')
    @ApiParam({ name: 'channelConfigId', type: String, required: true })
    @ApiResponse({ status: 200, type: ChannelConfigDto, isArray: false })
    getChannelById(@Body('phoneNumber') phoneNumber: string) {
        return this.channelService.getD360ChannelConfigByPhoneNumber(phoneNumber);
    }
}
