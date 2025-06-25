import * as mongoose from 'mongoose';

export interface AccessSetting {
    userList: mongoose.Types.ObjectId[];
    ipListData: string[];
}
export interface WorkspaceAccessControl {
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    accessSettings: AccessSetting;
}
