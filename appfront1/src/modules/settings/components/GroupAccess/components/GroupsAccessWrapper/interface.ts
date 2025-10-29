export interface AccessSetting {
    userList: string[];
    ipListData: string[];
}

export interface WorkspaceAccessControl {
    _id?: string;
    workspaceId: string;
    name: string;
    accessSettings: AccessSetting;
}