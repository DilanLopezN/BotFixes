import type { Dispatch, SetStateAction } from 'react';
import type { TeamUser } from '~/interfaces/team';
import type { User } from '~/interfaces/user';
import { AddUserSteps } from '../../constants';

export interface UserTableProps {
  userList: User[];
  userListWithPermissions: TeamUser[];
  isLoadingUserList: boolean;
  selectedRowKeys: string[];
  setSelectedRowKeys: Dispatch<SetStateAction<string[]>>;
  setCurrentStep: Dispatch<SetStateAction<AddUserSteps>>;
  setSelectedUserIdListToAddPermissions: Dispatch<SetStateAction<string[]>>;
  setShouldOnlyAddPermissions: Dispatch<SetStateAction<boolean>>;
}

export interface AddUserFooterProps {
  userListWithPermissions: TeamUser[];
  selectedRowKeys: string[];
  onClose: () => void;
  setCurrentStep: Dispatch<SetStateAction<AddUserSteps>>;
  setSelectedUserIdListToAddPermissions: Dispatch<SetStateAction<string[]>>;
  setTeamUserList: Dispatch<SetStateAction<TeamUser[]>>;
  setShouldOnlyAddPermissions: Dispatch<SetStateAction<boolean>>;
}
