import { Workspace } from '../../../../model/Workspace';

export interface TabRealTimeComponentProps {
    selectedWorkspace: Workspace;
}

export type ResultAnalytics = UsersAnalytics | TeamsAnalytics;

interface BaseAnalytics {
    key: string;
    countInAttendance: number;
    countForService: number;
    attendanceAverageTimeValueClose?: number;
    countClosedAttendance: number;
}

export interface UsersAnalytics extends BaseAnalytics {
    user: string;
    waitingAverageTime: number;
    attendanceAverageTime: number;
    closedToday: number;
}

export interface TeamsAnalytics extends BaseAnalytics {
    team: string;
    attendanceAverageTimeValue: number;
    waitingAverageTime: number;
    waitingAverageTimeValue: number;
    waitingAverageTimeValueClose: number;
    attendanceAverageTime: number;
}
