import { ChannelIdConfig } from 'kissbot-core';

export interface CreateActiveMessageSettingDto {
    channelConfigToken: string;
    enabled: boolean;
    settingName?: string;
    callbackUrl: string;
    expirationTimeType?: TimeType;
    expirationTime?: number;
    suspendConversationUntilType?: TimeType;
    suspendConversationUntilTime?: number;
    sendMessageToOpenConversation?: boolean;
    tags?: string[];
    objective?: ObjectiveType;
    action?: string;
    templateId?: string;
    authorizationHeader?: string;
    endMessage?: string;
    data?: {
        contactListLimit?: number;
    };
}

export interface UpdateActiveMessageSettingDto {
    id: string;
    settingName?: string;
    enabled: boolean;
    channelConfigToken: string;
    callbackUrl: string;
    expirationTimeType?: TimeType;
    expirationTime?: number;
    suspendConversationUntilType?: TimeType;
    suspendConversationUntilTime?: number;
    sendMessageToOpenConversation?: boolean;
    tags?: string[];
    objective?: ObjectiveType;
    action?: string;
    templateId?: string;
    authorizationHeader?: string;
    endMessage?: string;
    data?: {
        contactListLimit?: number;
    };
}

export interface ActiveMessageSetting {
    id?: string;
    settingName?: string;
    enabled: boolean;
    channelConfigToken?: string;
    apiToken?: string;
    callbackUrl?: string;
    expirationTimeType?: TimeType;
    expirationTime?: number;
    suspendConversationUntilType?: TimeType;
    suspendConversationUntilTime?: number;
    sendMessageToOpenConversation?: boolean;
    tags?: string[];
    objective?: ObjectiveType;
    action?: string;
    templateId?: string;
    authorizationHeader?: string;
    endMessage?: string;
    data?: {
        contactListLimit?: number;
    };
}

export enum TimeType {
    'days' = 'days',
    'hours' = 'hours',
    'minutes' = 'minutes',
}

export enum ObjectiveType {
    'api' = ChannelIdConfig.api,
    'campaign' = ChannelIdConfig.campaign,
    'confirmation' = ChannelIdConfig.confirmation,
    'reminder' = ChannelIdConfig.reminder,
    'nps' = ChannelIdConfig.nps,
    'medical_report' = ChannelIdConfig.medical_report,
    'api_ivr' = ChannelIdConfig.api_ivr,
    'schedule_notification' = ChannelIdConfig.schedule_notification,
    'recover_lost_schedule' = ChannelIdConfig.recover_lost_schedule,
    'nps_score' = ChannelIdConfig.nps_score,
    'documents_request' = ChannelIdConfig.documents_request,
    'active_mkt' = ChannelIdConfig.active_mkt,
}

export interface ActiveMessageStatusData {
    id?: string;
    statusName: string;
    statusCode: number;
}
