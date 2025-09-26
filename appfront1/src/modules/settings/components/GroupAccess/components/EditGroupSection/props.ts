import { User } from "kissbot-core";
import { WorkspaceAccessControl } from "../GroupsAccessWrapper/interface";

export interface EditGroupSectionProps {
    group: WorkspaceAccessControl;
    onChange: Function;
    userList: User[];
    formik: any;
    submitted: boolean;
}