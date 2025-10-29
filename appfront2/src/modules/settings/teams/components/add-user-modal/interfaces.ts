import type { Dispatch, SetStateAction } from 'react';
import type { TeamUser } from '~/interfaces/team';
import type { User } from '~/interfaces/user';

export interface AddUserModalProps {
  isVisible: boolean;
  addedUsers: TeamUser[];
  userList: User[];
  isLoadingUserList: boolean;
  onClose: () => void;
  setTeamUserList: Dispatch<SetStateAction<TeamUser[]>>;
}
