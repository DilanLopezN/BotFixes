import { ChannelIdConfig } from '~/constants/channel-id-config';

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
}
