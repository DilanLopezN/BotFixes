import { Dispatch, SetStateAction } from 'react';
import type { TeamUser } from '~/interfaces/team';

export type SortOrder = 'ascend' | 'descend';
export interface UserTableProps {
  teamUserList: TeamUser[];
  isTeamInactive?: boolean;
  setTeamUserList: Dispatch<SetStateAction<TeamUser[]>>;
}
