import { ChannelConfig } from '../../../../../../model/Bot';
import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';
import { WorkspaceAccessControl } from '../../../GroupAccess/components/GroupsAccessWrapper/interface';

interface EditAutoAssignProps {
    workspaceId: string;
    selectedWorkspace: Workspace;
    group?: WorkspaceAccessControl | undefined;
}

interface LocationProps {
    hash?: string;
    key?: string;
    search?: string;
    state: {
        channels: ChannelConfig[];
        teams: Team[];
    };
}


export type { LocationProps, EditAutoAssignProps };
