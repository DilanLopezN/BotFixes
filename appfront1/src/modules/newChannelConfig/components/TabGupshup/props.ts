import { OptionsMenuChannel } from './../ChannelsMenu/props';
import { ChannelConfig } from '../../../../model/Bot';

export interface TabGupshupProps {
    channel: ChannelConfig;
    onChange: Function;
    selectedMenu: OptionsMenuChannel;
    addNotification: Function;
}