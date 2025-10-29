import { ChannelConfig } from '../../../../../../model/Bot';
import { ActiveMessageSetting } from '../../../../interfaces/active-message-setting-dto';


export interface EditActiveMessageProps {
    activeMessage: ActiveMessageSetting | undefined;
    workspaceId: string;
    addNotification: Function;
    onCancel: Function;
    onUpdatedActiveMessage: Function;
    onCreatedActiveMessage: Function;
    onDeletedActiveMessage: Function;
    editing: boolean;
    loadingRequest: boolean;
    channelList: ChannelConfig[];
}