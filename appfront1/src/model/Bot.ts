import { BaseModel } from './BaseModel';
import { ChannelIdConfig } from 'kissbot-core';

export interface BotLabelColor {
    name: string;
    hexColor: string;
}

export interface BotLabel {
    _id: string;
    name: string;
    color: BotLabelColor;
}

export interface Bot extends BaseModel {
    cloning?: boolean;
    name: string;
    workspaceId: string;
    publishedAt?: string;
    publishDisabled?: {
        disabled: boolean;
        disabledAt: number;
        user?: {
            id: string;
            name: string;
        };
    };
}

export interface ChannelConfig {
    _id?: string;
    name: string;
    token: string;
    botId?: string;
    expirationTime?: {
        time: number;
        timeType: string;
    };
    keepLive: boolean;
    enable: boolean;
    channelId: ChannelIdConfig;
    configData: any;
    workspaceId: string;
    attendancePeriods: {
        mon: [];
        tue: [];
        wed: [];
        thu: [];
        fri: [];
        sat: [];
        sun: [];
    };
    canStartConversation?: boolean;
    canValidateNumber?: boolean;
    blockInboundAttendance?: boolean;
}
