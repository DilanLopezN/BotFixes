import { ObjectiveType } from '~/constants/objective-type';
import { TimeType } from '~/constants/time-type';

export type ActiveMessageSetting = {
  id: number;
  workspaceId: string;
  settingName: string;
  channelConfigToken: string;
  apiToken: string;
  enabled: boolean;
  callbackUrl?: string;
  authorizationHeader?: string;
  templateId?: string;
  action?: string;
  expirationTimeType: TimeType;
  expirationTime: number;
  suspendConversationUntilType: TimeType;
  suspendConversationUntilTime: number;
  sendMessageToOpenConversation: boolean;
  tags?: string[];
  objective?: ObjectiveType;
  endMessage?: string;
  contactListLimit?: number;
  data?: { contactListLimit: number };
};
