import { OptionsMenuChannel } from './../ChannelsMenu/props';
import { ChannelConfig } from '../../../../model/Bot';

export interface TabGeneralChannelProps {
    channel: ChannelConfig;
    onChange: Function;
    selectedMenu: OptionsMenuChannel;
}