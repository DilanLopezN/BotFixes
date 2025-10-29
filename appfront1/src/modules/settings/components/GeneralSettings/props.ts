import { Workspace } from '../../../../model/Workspace';

export interface GeneralSettingsProps {
    selectedWorkspace: Workspace;
    setWorkspace: (workspace: Workspace) => any;
}
