import { ChannelIdConfig } from 'kissbot-core';
import { I18nProps } from "../../../i18n/interface/i18n.interface";
import { ChannelConfig } from "../../../../model/Bot";

export interface ChannelCardProps extends I18nProps{
  image?: string;
  title: string;
  description: string;
  history: any;
  openModal: Function;
  list: ChannelConfig[];
  channelId: ChannelIdConfig;
  match: any;
  addNotification: Function;
  addChannel: Function;
  mdi?: string;
  multiple: boolean;
  referencePage: string;
}