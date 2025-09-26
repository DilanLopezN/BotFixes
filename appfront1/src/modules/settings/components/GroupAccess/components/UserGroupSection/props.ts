import { User } from 'kissbot-core';
import { WorkspaceAccessControl } from '../GroupsAccessWrapper/interface';

export interface UserGroupSectionProps {
    group: WorkspaceAccessControl;
    onChange: Function;
    userList: User[];
    formik: any;
    submitted: boolean;
}