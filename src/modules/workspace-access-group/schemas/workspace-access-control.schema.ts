import * as mongoose from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';

export const AccessSettingSchema = new mongoose.Schema(
    {
        userList: [mongoose.Types.ObjectId],
        ipListData: [String]
    },
    { versionKey: false, _id: false },
);

export const WorkspaceAccessControlSchema = new mongoose.Schema(
    {
        workspaceId: {
            type: mongoose.Types.ObjectId,
            index: true,
        },
        name: String,
        accessSettings: AccessSettingSchema,
    },
    { versionKey: false, collection: 'workspace_access_control', strictQuery: true },
);

WorkspaceAccessControlSchema.plugin(AfterFindSoftDeletePlugin)

// export const WorkspaceAccessControlModel = mongoose.model(
//     'WorkspaceAccessControl',
//     WorkspaceAccessControlSchema,
// );