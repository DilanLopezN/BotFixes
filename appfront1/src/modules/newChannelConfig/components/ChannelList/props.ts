import { I18nProps } from "../../../i18n/interface/i18n.interface";
import { ChannelConfig } from "../../../../model/Bot";

export interface ChannelListProps extends I18nProps {
  menuSelected: any;
  channelList: ChannelConfig[];
  addNotification: Function;
  referencePage: string;
  workspaceChannelList: ChannelConfig[];
}