import { ChannelIdConfig } from 'kissbot-core';

export interface OptionsMenuChannel {
    ref: string;
    label: string;
    component: any;
    showOnChannelIdEquals: ChannelIdConfig[];
    sections: SectionOptionsMenuChannel[]
}

interface SectionOptionsMenuChannel {
    ref: string;
    showOnChannelIdEquals: ChannelIdConfig[];
}

export interface ChannelsMenuProps {
    options: OptionsMenuChannel[];
    onSelect: Function;
    selected: OptionsMenuChannel;
    channelId: ChannelIdConfig;
}