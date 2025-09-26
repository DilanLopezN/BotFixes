import { WorkspaceAccessControl } from "../GroupsAccessWrapper/interface";

export interface GroupsAccessListProps {
    loading: boolean;
    loadingMore: boolean;
    workspaceGroups: WorkspaceAccessControl[] | undefined;
    onEditGroup: Function;
}