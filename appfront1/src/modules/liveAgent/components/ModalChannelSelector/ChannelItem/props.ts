import { ChannelConfig } from './../../../../../model/Bot';

export interface ChannelItemProps {
    channel: ChannelConfig;
    onClick: () => void;
    selected: boolean;
    disabled?: boolean;
 }
