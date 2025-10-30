import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';

export interface TeamResumeProps {
    teams: Team[];
    selectedWorkspace: Workspace;
    expanded: boolean;
    onResetFilters?: () => void;
}

export interface FilterValuesTeamResume {
    [key: string]: any;
    selectedKeysData: string[];
    countForService: any;
    waitingAverageTime: any;
    countInAttendance: any;
    attendanceAverageTime: any;
    countClosedAttendance: any;
}
