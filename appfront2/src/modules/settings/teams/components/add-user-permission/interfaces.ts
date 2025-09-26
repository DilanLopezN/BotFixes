import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { TeamUser } from '~/interfaces/team';
import type { User } from '~/interfaces/user';
import { AddUserSteps } from '../../constants';
import type { PermissionListRef } from '../permission-list';

export interface AddUserPermissionProps {
  permissionListRef: RefObject<PermissionListRef>;
  userList: User[];
  selectedUserIdListToAddPermissions: string[];
  userListWithPermissions: TeamUser[];
  shouldOnlyAddPermissions: boolean;
}

export interface AddUserPermissionFooterProps {
  permissionListRef: RefObject<PermissionListRef>;
  shouldOnlyAddPermissions: boolean;
  selectedUserIdListToAddPermissions: string[];
  onClose: () => void;
  setSelectedRowKeys: Dispatch<SetStateAction<string[]>>;
  setCurrentStep: Dispatch<SetStateAction<AddUserSteps>>;
  setTeamUserList: Dispatch<SetStateAction<TeamUser[]>>;
  setUserListWithPermissions: Dispatch<SetStateAction<TeamUser[]>>;
  setSelectedUserIdListToAddPermissions: Dispatch<SetStateAction<string[]>>;
}
