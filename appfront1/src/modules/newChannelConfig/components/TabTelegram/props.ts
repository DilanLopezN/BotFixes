import { OptionsMenuChannel } from './../ChannelsMenu/props';
import { ChannelConfig } from '../../../../model/Bot';

export interface TabTelegramProps {
    channel: ChannelConfig;
    onChange: Function;
    selectedMenu: OptionsMenuChannel;
    addNotification: Function;
}