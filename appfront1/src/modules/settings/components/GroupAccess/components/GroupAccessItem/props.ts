import { WorkspaceAccessControl } from "../GroupsAccessWrapper/interface";

export interface GroupAccessItemProps {
    groupAccess: WorkspaceAccessControl;
    onEditGroup: Function;
    index: number;
}