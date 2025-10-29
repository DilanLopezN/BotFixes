import { ChannelConfig } from '../../../../../../model/Bot';
import { Workspace } from '../../../../../../model/Workspace';

export interface EditPrivacyPolicyProps {
    selectedWorkspace: Workspace;
    channelConfigList?: ChannelConfig[];
}
