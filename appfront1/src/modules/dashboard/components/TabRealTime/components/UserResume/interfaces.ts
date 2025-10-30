import { Workspace } from '../../../../../../model/Workspace';

export interface UserResumeProps {
    selectedWorkspace: Workspace;
    selectedTeamId: string;
    expanded: boolean;
    onResetFilters?: () => void;
}

export interface FilterValuesUserResume {
    [key: string]: [number | null, number | null];
    countForService: [number | null, number | null];
    waitingAverageTime: [number | null, number | null];
    countInAttendance: [number | null, number | null];
    attendanceAverageTime: [number | null, number | null];
    countClosedAttendance: [number | null, number | null];
}
