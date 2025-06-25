import { ObjectiveType, TimeType } from '../models/active-message-setting.entity';

export interface UpdateActiveMessageSettingData {
    id: number;
    enabled: boolean;
    callbackUrl: string;
    settingName?: string;
    templateId?: string;
    action?: string;
    authorizationHeader?: string;

    expirationTimeType: TimeType;
    expirationTime: number;
    suspendConversationUntilType: TimeType;
    suspendConversationUntilTime: number;

    sendMessageToOpenConversation?: boolean;
    channelConfigToken?: string;
    tags?: string[];
    objective?: ObjectiveType;
    endMessage?: string;
    data?: Record<string, any>;
}
