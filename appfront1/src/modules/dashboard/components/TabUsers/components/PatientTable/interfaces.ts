import type { Team } from '../../../../../../model/Team';
import type { Workspace } from '../../../../../../model/Workspace';
import type { ConversationFilterInterface } from '../../../ConversationFilter/props';

export interface PatientTableProps {
    filters: ConversationFilterInterface;
    selectedWorkspace: Workspace;
    teams: Team[];
}
export interface PatientTablePatientTable {
    [key: string]: [number | null, number | null];
    timeUserReplyAvg: [number | null, number | null];
    timeAgentReplyAvg: [number | null, number | null];
    count: [number | null, number | null];
    awaitingWorkingTime: [number | null, number | null];
    timeAgentFirstReplyAvg: [number | null, number | null];
    timeToCloseAvg: [number | null, number | null];
    memberFinished: [number | null, number | null];
}

export interface PatientTableRef {
    handleDownload: (downloadType: string) => Promise<void>;
}
