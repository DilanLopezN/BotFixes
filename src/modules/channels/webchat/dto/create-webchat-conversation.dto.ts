import { ApiProperty } from "@nestjs/swagger";
import { ChannelIdConfig } from "./../../../channel-config/interfaces/channel-config.interface";


export class CreateWebchatConversationUserDto {
    @ApiProperty({enum: [ChannelIdConfig.webchat , ChannelIdConfig.webemulator]})
    channelId: ChannelIdConfig.webchat | ChannelIdConfig.webemulator
    
    @ApiProperty()
    data: {
        botId: string;
    };

    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;
}

export class CreateWebchatConversationDto {
    @ApiProperty()
    botId: string;
    
    @ApiProperty()
    channelConfigId;

    @ApiProperty()
    token: string;

    @ApiProperty()
    expirationTime?: {
        time: number,
        timeType: 'hour' | 'minute',
    };

    @ApiProperty()
    channelId: string;

    @ApiProperty()
    user: CreateWebchatConversationUserDto;
}