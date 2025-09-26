import type { Dispatch, SetStateAction } from 'react';
import type { TeamUser } from '~/interfaces/team';
import type { User } from '~/interfaces/user';

export interface EditPermissionModalProps {
  userList: User[];
  teamUserList: TeamUser[];
  selectedUserIdListToAddPermissions: string[];
  isVisible: boolean;
  shouldOnlyAddPermissions: boolean;
  onClose: () => void;
  setTeamUserList: Dispatch<SetStateAction<TeamUser[]>>;
  setSelectedUserIdListToAddPermissions: Dispatch<SetStateAction<string[]>>;
}
