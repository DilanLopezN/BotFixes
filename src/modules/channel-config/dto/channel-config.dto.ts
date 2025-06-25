import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ChannelIdConfig } from '../interfaces/channel-config.interface';
import { KissbotEventType } from 'kissbot-core';
import { ChannelConfigWhatsappProvider } from '../schemas/channel-config.schema';

export class ChannelConfigDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    whatsappProvider?: ChannelConfigWhatsappProvider;

    @ApiProperty()
    @IsString()
    expirationTime?: string;

    @ApiProperty()
    keepLive?: boolean;

    @ApiProperty()
    enable?: boolean;

    @ApiProperty()
    configData?: any;

    @ApiProperty()
    @IsString()
    channelId: ChannelIdConfig;

    @ApiProperty()
    botId?: string;

    @ApiProperty()
    workspaceId?: string;
}

export class CreateEventRequest{
    @ApiProperty()
    dataType: any;
    @ApiProperty()
    data: any;
    @ApiProperty()
    eventType: KissbotEventType;
}