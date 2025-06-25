import { Document } from 'mongoose';
import { ChannelIdConfig } from 'kissbot-core';
import { ChannelConfigWhatsappProvider } from '../schemas/channel-config.schema';

export interface ChannelConfig extends Document {
    name: string;
    token: string;
    botId?: string;
    workspaceId?: string;
    organizationId?: string;
    expirationTime: {
        time: number;
        timeType: string;
    };
    endMessage: string;
    keepLive: boolean;
    enable: boolean;
    channelId: ChannelIdConfig;
    configData: any;
    canValidateNumber?: boolean;
    blockInboundAttendance?: boolean;
    whatsappProvider?: ChannelConfigWhatsappProvider;
}
export { ChannelIdConfig };
