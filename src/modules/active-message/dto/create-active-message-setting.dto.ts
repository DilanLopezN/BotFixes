import { CreateActiveMessageSettingData } from '../interfaces/create-active-message-setting-data.interface';
import { ObjectiveType, TimeType } from '../models/active-message-setting.entity';

export interface CreateActiveMessageSettingDto extends CreateActiveMessageSettingData {
    channelConfigToken: string;
    enabled: boolean;
    callbackUrl: string;
    settingName?: string;
    templateId?: string;
    action?: string;

    expirationTimeType: TimeType;
    expirationTime: number;
    suspendConversationUntilType: TimeType;
    suspendConversationUntilTime: number;

    sendMessageToOpenConversation?: boolean;
    tags?: string[];
    objective?: ObjectiveType;
    endMessage?: string;
    data?: any;
}
