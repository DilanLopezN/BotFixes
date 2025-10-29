import { ChannelConfig } from "../../../../../../model/Bot";
import { ActiveMessageSetting } from "../../../../interfaces/active-message-setting-dto";

export interface ActiveMessageListProps {
    addNotification: Function;
    workspaceId: string;
    loading: boolean;
    workspaceChannels: ChannelConfig[];
    workspaceActiveMessage: ActiveMessageSetting[];
    onDeletedActiveMessage: Function;
    onEditActiveMessage: Function;
}