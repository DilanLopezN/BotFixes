import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';

export interface TeamResumeProps {
    teams: Team[];
    selectedWorkspace: Workspace;
    expanded: boolean;
}

export interface FilterValuesTeamResume{
  [key: string]: [number | null, number | null];
  countForService: [number | null, number | null];
  waitingAverageTime: [number | null, number | null];
  countInAttendance: [number | null, number | null];
  attendanceAverageTime: [number | null, number | null];
  countClosedAttendance: [number | null, number | null];
}
