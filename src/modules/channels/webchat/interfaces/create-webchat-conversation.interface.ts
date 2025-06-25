import { ChannelIdConfig } from "./../../../channel-config/interfaces/channel-config.interface";

export interface ICreateWebchatConversationUser {
    channelId: ChannelIdConfig.webchat | ChannelIdConfig.webemulator
    data: {
        botId: string;
    };
    id: string;
    name: string;
}

export interface ICreateWebchatConversation {
    botId: string;
    channelConfigId;
    token: string;
    expirationTime?: {
        time: number,
        timeType: 'hour' | 'minute',
    };
    channelId: string;
    user: ICreateWebchatConversationUser;
}