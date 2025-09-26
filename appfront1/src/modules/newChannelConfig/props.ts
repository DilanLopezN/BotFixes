import { I18nProps } from "../i18n/interface/i18n.interface";

export interface ChannelConfigProps extends I18nProps {
  setCurrentBot: Function;
  setChannelList: Function;
  setWorkspaceChannelList: Function;
  match: any;
  history: any;
}