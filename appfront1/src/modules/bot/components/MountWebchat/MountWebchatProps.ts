import { Interaction } from "../../../../model/Interaction";
import { ChannelConfig } from "../../../../model/Bot";

export interface MountWebchatProps {
    setCurrentExecutingInteraction: (...params) => any;
    interactionList: Interaction[];
    channelList: ChannelConfig[]
    setChannelList: (botId) => any;
    match?: any;
    children?: React.ReactNode;
}

export interface MountWebchatState {
    showChannel: boolean;
    channel: ChannelConfig | undefined;
    demoUrl: string;
    infoModalData: string;
}
